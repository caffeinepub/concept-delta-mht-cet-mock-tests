import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import List "mo:core/List";
import Order "mo:core/Order";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  type UserProfile = {
    id : Principal;
    fullName : Text;
    email : Text;
    mobileNumber : Text;
    testAttempts : [TestAttempt];
    createdAt : Time.Time;
    lastLogin : Time.Time;
    isYouTubeVerified : Bool;
    youtubeVerificationTimestamp : ?Time.Time;
    isBlocked : Bool;
    blockTimestamp : ?Time.Time;
  };

  type TestAttempt = {
    userId : Principal;
    testId : Nat;
    answers : [Nat];
    score : Float;
    timeTaken : Nat;
    submittedAt : Time.Time;
  };

  type Option = {
    text : Text;
    image : ?Storage.ExternalBlob;
  };

  type Question = {
    id : Nat;
    subject : Text;
    chapter : Text;
    difficulty : Text;
    questionText : Text;
    options : [Option];
    correctAnswer : Nat;
    explanation : ?Text;
    image : ?Storage.ExternalBlob;
    createdBy : Principal;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
    classLevel : TestType;
  };

  type SanitizedQuestion = {
    id : Nat;
    subject : Text;
    chapter : Text;
    difficulty : Text;
    questionText : Text;
    options : [Option];
    image : ?Storage.ExternalBlob;
  };

  public type TestStatus = { #scheduled; #live; #ended; #finished };

  public type TestType = {
    #class11;
    #class12;
    #completeSyllabus;
  };

  type TestConfig = {
    id : Nat;
    name : Text;
    subject : Text;
    chapters : [Text];
    testType : TestType;
    durationMinutes : Nat;
    totalQuestions : Nat;
    markingScheme : {
      correctMarks : Float;
      incorrectPenalty : Float;
    };
    questions : [Nat];
    createdBy : Principal;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
    isPublished : Bool;
    isStopped : Bool;
    startTime : ?Time.Time;
    endTime : ?Time.Time;
    sectionType : ?SectionType;
  };

  public type SectionType = {
    #physicsChemistry;
    #mathematics;
    #full;
  };

  type ActiveSession = {
    userId : Principal;
    testId : Nat;
    startTime : Time.Time;
    lastActivity : Time.Time;
  };

  type SystemMetrics = {
    activeSessionCount : Nat;
    totalUsers : Nat;
    totalQuestions : Nat;
    totalTests : Nat;
    timestamp : Time.Time;
  };

  type GalleryQuestionPreview = {
    id : Nat;
    subject : Text;
    chapter : Text;
    difficulty : Text;
    questionText : Text;
    hasImage : Bool;
    previewImage : ?Storage.ExternalBlob;
    options : [Option];
    snippet : Text;
  };

  public type Comment = {
    id : Nat;
    questionId : Nat;
    userId : Principal;
    text : Text;
    timestamp : Time.Time;
  };

  public type LeaderboardEntry = {
    userProfile : UserProfile;
    score : Float;
    rank : Nat;
    submittedAt : Time.Time;
  };

  public type OverallLeaderboardEntry = {
    userProfile : UserProfile;
    averageScore : Float;
    totalAttempts : Nat;
    rank : Nat;
  };

  type Suggestion = {
    id : Nat;
    author : Text;
    feedback : Text;
    timestamp : Time.Time;
  };

  type SuggestionsResponse = {
    suggestions : [Suggestion];
    count : Nat;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let questionBank = Map.empty<Nat, Question>();
  let testConfigs = Map.empty<Nat, TestConfig>();
  let activeSessions = Map.empty<Principal, ActiveSession>();
  let suggestions = Map.empty<Nat, Suggestion>();
  var testConfigOrder : [Nat] = [];
  var nextQuestionId = 1;
  var nextSuggestionId = 1;
  var nextTestConfigId = 1;
  var firstAdminAssigned = false;

  let comments = Map.empty<Nat, Comment>();
  var nextCommentId = 1;

  public query ({ caller }) func getPublishedTests() : async {
    publishedTests : [TestConfig];
    liveCount : Nat;
    scheduledCount : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view published tests");
    };

    requireNotBlocked(caller);

    let allConfigs : [TestConfig] = testConfigs.values().toArray();

    let now = Time.now();
    let liveConfigs = allConfigs.filter(
      func(config) { config.isPublished and isLive(config, now) }
    );

    let scheduledConfigs = allConfigs.filter(
      func(config) { config.isPublished and isScheduled(config, now) }
    );

    {
      publishedTests = allConfigs.filter(func(test) { test.isPublished });
      liveCount = liveConfigs.size();
      scheduledCount = scheduledConfigs.size();
    };
  };

  func isLive(test : TestConfig, now : Time.Time) : Bool {
    switch (test.startTime, test.endTime) {
      case (?start, ?end) { now >= start and now <= end };
      case (_) { false };
    };
  };

  func isScheduled(test : TestConfig, now : Time.Time) : Bool {
    switch (test.startTime, test.endTime) {
      case (?start, _) { now < start };
      case (_) { false };
    };
  };

  private func sanitizeQuestion(question : Question) : SanitizedQuestion {
    {
      id = question.id;
      subject = question.subject;
      chapter = question.chapter;
      difficulty = question.difficulty;
      questionText = question.questionText;
      options = question.options;
      image = question.image;
    };
  };

  private func calculateScore(answers : [Nat], testConfig : TestConfig) : Float {
    var score : Float = 0.0;
    let questions = testConfig.questions;

    if (answers.size() != questions.size()) {
      return 0.0;
    };

    var i = 0;
    while (i < answers.size()) {
      switch (questionBank.get(questions[i])) {
        case (null) { /* Skip invalid question */ };
        case (?question) {
          if (answers[i] == question.correctAnswer) {
            score += testConfig.markingScheme.correctMarks;
          } else if (answers[i] != 0) {
            score -= testConfig.markingScheme.incorrectPenalty;
          };
        };
      };
      i += 1;
    };

    score;
  };

  private func isYouTubeVerified(userId : Principal) : Bool {
    switch (userProfiles.get(userId)) {
      case (null) { false };
      case (?profile) { profile.isYouTubeVerified };
    };
  };

  private func isUserBlockedInternal(userId : Principal) : Bool {
    switch (userProfiles.get(userId)) {
      case (null) { false };
      case (?profile) { profile.isBlocked };
    };
  };

  private func requireYouTubeVerification(caller : Principal) {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return;
    };

    if (not isYouTubeVerified(caller)) {
      Runtime.trap("Unauthorized: YouTube subscription verification required to access tests");
    };
  };

  private func requireNotBlocked(caller : Principal) {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return;
    };

    if (isUserBlockedInternal(caller)) {
      Runtime.trap("Unauthorized: Your account has been blocked. Please contact support.");
    };
  };

  func _getUserProfileInternal(userId : Principal) : ?UserProfile {
    userProfiles.get(userId);
  };

  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };

    requireNotBlocked(caller);

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Not registered") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or admin can view any profile");
    };

    if (caller == user) {
      requireNotBlocked(caller);
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func isCallerBlocked() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check block status");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) { profile.isBlocked };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };

    if (profile.id != caller) {
      Runtime.trap("Unauthorized: Cannot save profile for another user");
    };

    // Check if user is blocked (except during initial registration)
    let existingProfile = userProfiles.get(caller);
    switch (existingProfile) {
      case (?existing) {
        if (existing.isBlocked) {
          Runtime.trap("Unauthorized: Your account has been blocked. Please contact support.");
        };
      };
      case (null) { /* First time registration allowed */ };
    };

    if (not firstAdminAssigned and userProfiles.size() == 0) {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
      firstAdminAssigned := true;
    };

    let existingAttempts = switch (existingProfile) {
      case (null) { [] };
      case (?existing) { existing.testAttempts };
    };

    let safeProfile = {
      id = caller;
      fullName = profile.fullName;
      email = profile.email;
      mobileNumber = profile.mobileNumber;
      testAttempts = existingAttempts;
      createdAt = profile.createdAt;
      lastLogin = Time.now();
      isYouTubeVerified = false;
      youtubeVerificationTimestamp = null;
      isBlocked = false;
      blockTimestamp = null;
    };

    userProfiles.add(caller, safeProfile);
  };

  public shared ({ caller }) func updateCallerMobileNumber(mobileNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update mobile number");
    };

    requireNotBlocked(caller);

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) {
        let updatedProfile = { profile with mobileNumber };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getCallerRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func addQuestion(
    subject : Text,
    chapter : Text,
    difficulty : Text,
    questionText : Text,
    options : [Option],
    correctAnswer : Nat,
    explanation : ?Text,
    image : ?Storage.ExternalBlob,
    classLevel : TestType,
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add questions");
    };

    if (correctAnswer >= options.size() and options.size() > 0) {
      Runtime.trap("Invalid correct answer index");
    };

    let question : Question = {
      id = nextQuestionId;
      subject;
      chapter;
      difficulty;
      questionText;
      options;
      correctAnswer;
      explanation;
      image;
      createdBy = caller;
      createdAt = Time.now();
      updatedAt = null;
      classLevel;
    };
    questionBank.add(nextQuestionId, question);
    nextQuestionId += 1;
    question.id;
  };

  public shared ({ caller }) func updateQuestion(
    questionId : Nat,
    questionData : {
      subject : Text;
      chapter : Text;
      difficulty : Text;
      questionText : Text;
      options : [Option];
      correctAnswer : Nat;
      explanation : ?Text;
      image : ?Storage.ExternalBlob;
      classLevel : TestType;
    },
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update questions");
    };

    if (questionData.correctAnswer >= questionData.options.size() and questionData.options.size() > 0) {
      Runtime.trap("Invalid correct answer index");
    };

    switch (questionBank.get(questionId)) {
      case (null) { Runtime.trap("Question not found") };
      case (?existing) {
        let updatedQuestion : Question = {
          id = questionId;
          subject = questionData.subject;
          chapter = questionData.chapter;
          difficulty = questionData.difficulty;
          questionText = questionData.questionText;
          options = questionData.options;
          correctAnswer = questionData.correctAnswer;
          explanation = questionData.explanation;
          image = questionData.image;
          createdBy = existing.createdBy;
          createdAt = existing.createdAt;
          updatedAt = ?Time.now();
          classLevel = questionData.classLevel;
        };
        questionBank.add(questionId, updatedQuestion);
      };
    };
  };

  public shared ({ caller }) func setQuestionClassLevel(questionId : Nat, classLevel : TestType) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update question class level");
    };

    switch (questionBank.get(questionId)) {
      case (null) { Runtime.trap("Question not found") };
      case (?existing) {
        let updatedQuestion = { existing with classLevel };
        questionBank.add(questionId, updatedQuestion);
      };
    };
  };

  public shared ({ caller }) func addQuestionsWithClassLevel(
    questions : [Question],
    classLevel : TestType,
  ) : async [Nat] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add questions");
    };

    let ids : [Nat] = Array.tabulate<Nat>(
      questions.size(),
      func(i) {
        let question = questions[i];
        let questionWithClass = { question with classLevel };
        questionBank.add(nextQuestionId, questionWithClass);
        let savedId = nextQuestionId;
        nextQuestionId += 1;
        savedId;
      },
    );
    ids;
  };

  public query ({ caller }) func getQuestion(questionId : Nat) : async Question {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view full question details");
    };

    switch (questionBank.get(questionId)) {
      case (null) { Runtime.trap("Question not found") };
      case (?question) { question };
    };
  };

  public query ({ caller }) func getQuestionsBySubject(subject : Text) : async [Question] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view questions with answers");
    };

    let questions = questionBank.values().toArray();
    questions.filter(
      func(q) {
        Text.equal(q.subject, subject);
      }
    );
  };

  public query ({ caller }) func getQuestionsByChapter(subject : Text, chapter : Text) : async [Question] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view questions with answers");
    };

    let questions = questionBank.values().toArray();
    questions.filter(
      func(q) {
        Text.equal(q.subject, subject) and Text.equal(q.chapter, chapter);
      }
    );
  };

  public shared ({ caller }) func createTestConfig(
    name : Text,
    subject : Text,
    chapters : [Text],
    testType : TestType,
    durationMinutes : Nat,
    totalQuestions : Nat,
    markingScheme : {
      correctMarks : Float;
      incorrectPenalty : Float;
    },
    questions : [Nat],
    startTime : ?Time.Time,
    endTime : ?Time.Time,
    sectionType : ?SectionType,
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create tests");
    };

    for (qId in questions.vals()) {
      switch (questionBank.get(qId)) {
        case (null) { Runtime.trap("Question ID " # qId.toText() # " does not exist") };
        case (?_) { /* Valid question */ };
      };
    };

    let config : TestConfig = {
      id = nextTestConfigId;
      name;
      subject;
      chapters;
      testType;
      durationMinutes;
      totalQuestions;
      markingScheme;
      questions;
      createdBy = caller;
      createdAt = Time.now();
      updatedAt = null;
      isPublished = false;
      isStopped = false;
      startTime;
      endTime;
      sectionType;
    };
    testConfigs.add(nextTestConfigId, config);
    nextTestConfigId += 1;

    let newOrder = Array.tabulate(
      testConfigOrder.size() + 1,
      func(i) {
        if (i == testConfigOrder.size()) { config.id } else {
          testConfigOrder[i];
        };
      },
    );
    testConfigOrder := newOrder;

    config.id;
  };

  public shared ({ caller }) func updateTestConfig(
    testId : Nat,
    configData : {
      name : Text;
      subject : Text;
      chapters : [Text];
      testType : TestType;
      durationMinutes : Nat;
      totalQuestions : Nat;
      markingScheme : {
        correctMarks : Float;
        incorrectPenalty : Float;
      };
      questions : [Nat];
      startTime : ?Time.Time;
      endTime : ?Time.Time;
      sectionType : ?SectionType;
    },
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update test configs");
    };

    for (qId in configData.questions.vals()) {
      switch (questionBank.get(qId)) {
        case (null) { Runtime.trap("Question ID " # qId.toText() # " does not exist") };
        case (?_) { /* Valid question */ };
      };
    };

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?existing) {
        let updatedConfig : TestConfig = {
          id = testId;
          name = configData.name;
          subject = configData.subject;
          chapters = configData.chapters;
          testType = configData.testType;
          durationMinutes = configData.durationMinutes;
          totalQuestions = configData.totalQuestions;
          markingScheme = configData.markingScheme;
          questions = configData.questions;
          createdBy = existing.createdBy;
          createdAt = existing.createdAt;
          updatedAt = ?Time.now();
          isPublished = existing.isPublished;
          isStopped = existing.isStopped;
          startTime = configData.startTime;
          endTime = configData.endTime;
          sectionType = configData.sectionType;
        };
        testConfigs.add(testId, updatedConfig);
      };
    };
  };

  public query ({ caller }) func getTestConfig(testId : Nat) : async TestConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test configs");
    };

    requireNotBlocked(caller);

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?config) {
        if (not config.isPublished and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Test config is not published");
        };
        config;
      };
    };
  };

  public query ({ caller }) func getAllTestConfigs() : async [TestConfig] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all test configs");
    };
    testConfigs.values().toArray();
  };

  public query ({ caller }) func getTestConfigsWithStatus() : async [(TestConfig, TestStatus)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test statuses");
    };

    requireNotBlocked(caller);

    let now = Time.now();
    let configs = testConfigs.values().toArray();

    let visibleConfigs = if (AccessControl.isAdmin(accessControlState, caller)) {
      configs;
    } else {
      configs.filter(func(config) { config.isPublished });
    };

    visibleConfigs.map(
      func(config) {
        let status = getTestStatusInternal(config, now);
        (config, status);
      }
    );
  };

  public query ({ caller }) func getActivePublishedTestConfigs() : async [TestConfig] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test configs");
    };

    requireYouTubeVerification(caller);
    requireNotBlocked(caller);

    let allConfigs = testConfigs.values().toArray();
    let now = Time.now();

    allConfigs.filter(
      func(config) {
        let status = getTestStatusInternal(config, now);
        config.isPublished and status == #live
      }
    );
  };

  public query ({ caller }) func getStoppedTestConfigs() : async [TestConfig] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test configs");
    };

    requireNotBlocked(caller);

    let allConfigs = testConfigs.values().toArray();
    if (allConfigs.isEmpty()) {
      [];
    } else {
      allConfigs.filter(
        func(config) { config.isPublished and config.isStopped }
      );
    };
  };

  public shared ({ caller }) func startTestSession(testId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can start test sessions");
    };

    requireYouTubeVerification(caller);
    requireNotBlocked(caller);

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?testConfig) {
        if (not testConfig.isPublished) {
          Runtime.trap("Test config is not published");
        };

        let status = getTestStatusInternal(testConfig, Time.now());
        if (status != #live) {
          Runtime.trap("Test is not currently live");
        };

        if (testConfig.isStopped) {
          Runtime.trap("Test is stopped and cannot be taken");
        };
        let session : ActiveSession = {
          userId = caller;
          testId;
          startTime = Time.now();
          lastActivity = Time.now();
        };
        activeSessions.add(caller, session);
      };
    };
  };

  public shared ({ caller }) func updateSessionActivity(testId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update session activity");
    };

    requireNotBlocked(caller);

    switch (activeSessions.get(caller)) {
      case (null) { Runtime.trap("No active session found") };
      case (?session) {
        if (session.testId != testId) {
          Runtime.trap("Test ID mismatch with active session");
        };
        let updatedSession = { session with lastActivity = Time.now() };
        activeSessions.add(caller, updatedSession);
      };
    };
  };

  public shared ({ caller }) func submitTestAttempt(testId : Nat, answers : [Nat]) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit tests");
    };

    requireYouTubeVerification(caller);
    requireNotBlocked(caller);

    let session = switch (activeSessions.get(caller)) {
      case (null) { Runtime.trap("No active test session found") };
      case (?s) {
        if (s.testId != testId) {
          Runtime.trap("Test ID mismatch with active session");
        };
        s;
      };
    };

    let testConfig = switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?config) { config };
    };

    if (answers.size() != testConfig.questions.size()) {
      Runtime.trap("Answer count does not match question count");
    };

    let timeTaken = Int.abs(Time.now() - session.startTime) / 1_000_000_000;
    let maxAllowedTime = (testConfig.durationMinutes + 5) * 60;
    if (timeTaken > maxAllowedTime) {
      Runtime.trap("Test submission time exceeded allowed duration");
    };

    let calculatedScore = calculateScore(answers, testConfig);

    let attempt : TestAttempt = {
      userId = caller;
      testId;
      answers;
      score = calculatedScore;
      timeTaken;
      submittedAt = Time.now();
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let updatedAttempts = Array.tabulate(
          profile.testAttempts.size() + 1,
          func(i) {
            if (i == 0) {
              attempt;
            } else {
              profile.testAttempts[i - 1];
            };
          },
        );
        let updatedProfile : UserProfile = { profile with testAttempts = updatedAttempts };
        userProfiles.add(caller, updatedProfile);
      };
    };

    activeSessions.remove(caller);

    calculatedScore;
  };

  public query ({ caller }) func getQuestionCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access this data");
    };
    questionBank.size();
  };

  public query ({ caller }) func getTestConfigCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access this data");
    };
    testConfigs.size();
  };

  public query ({ caller }) func getUserCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access this data");
    };
    userProfiles.size();
  };

  public shared ({ caller }) func uploadQuestionImage(image : Storage.ExternalBlob) : async Storage.ExternalBlob {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can upload images");
    };
    image;
  };

  public query ({ caller }) func getQuestionByTestConfig(testConfigId : Nat) : async {
    questions : [SanitizedQuestion];
    testConfig : TestConfig;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test questions");
    };

    if (not AccessControl.isAdmin(accessControlState, caller)) {
      requireYouTubeVerification(caller);
      requireNotBlocked(caller);
    };

    switch (testConfigs.get(testConfigId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?testConfig) {
        if (not testConfig.isPublished and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Test config is not published");
        };

        let hasActiveSession = switch (activeSessions.get(caller)) {
          case (null) { false };
          case (?session) { session.testId == testConfigId };
        };

        if (not hasActiveSession and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("No active test session found for this test");
        };

        let questions = testConfig.questions.map(
          func(questionId) {
            switch (questionBank.get(questionId)) {
              case (null) {
                Runtime.trap("Question in test config not found (Test ID: " # testConfigId.toText() # ", Question ID: " # questionId.toText() # ")")
              };
              case (?question) { sanitizeQuestion(question) };
            };
          }
        );
        { questions; testConfig };
      };
    };
  };

  public query ({ caller }) func getQuestionWithAnswersByTestConfig(testConfigId : Nat) : async {
    questions : [Question];
    testConfig : TestConfig;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view questions with answers");
    };

    switch (testConfigs.get(testConfigId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?testConfig) {
        let questions = testConfig.questions.map(
          func(questionId) {
            switch (questionBank.get(questionId)) {
              case (null) {
                Runtime.trap("Question in test config not found (Test ID: " # testConfigId.toText() # ", Question ID: " # questionId.toText() # ")")
              };
              case (?question) { question };
            };
          }
        );
        { questions; testConfig };
      };
    };
  };

  public query ({ caller }) func getQuestionsForChapter(subject : Text, chapter : Text) : async [Question] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view questions with answers");
    };

    let questions = questionBank.values().toArray();
    questions.filter(
      func(q) {
        Text.equal(q.subject, subject) and Text.equal(q.chapter, chapter);
      }
    );
  };

  public query ({ caller }) func getAllUniqueChaptersForSubject(subject : Text) : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view chapter data");
    };

    requireNotBlocked(caller);

    let filteredQuestions = questionBank.values().toArray().filter(
      func(q) {
        Text.equal(q.subject, subject);
      }
    );

    let uniqueChapters = Map.empty<Text, Bool>();
    for (question in filteredQuestions.values()) {
      uniqueChapters.add(question.chapter, true);
    };

    uniqueChapters.keys().toArray();
  };

  public query ({ caller }) func getAllQuestionsWithImages() : async [Question] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view questions with answers");
    };

    let questions = questionBank.values().toArray();
    questions.filter(
      func(q) {
        switch (q.image) {
          case (?_image) { true };
          case (null) { false };
        };
      }
    );
  };

  public shared ({ caller }) func addOptionImageToQuestion(questionId : Nat, optionIndex : Nat, image : Storage.ExternalBlob) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add option images");
    };

    switch (questionBank.get(questionId)) {
      case (null) { Runtime.trap("Question not found") };
      case (?question) {
        if (optionIndex >= question.options.size()) {
          Runtime.trap("Option index out of bounds");
        };

        let updatedOptions = Array.tabulate(
          question.options.size(),
          func(i) {
            if (i == optionIndex) {
              let originalOption = question.options[i];
              {
                text = originalOption.text;
                image = ?image;
              };
            } else {
              question.options[i];
            };
          },
        );

        let updatedQuestion = {
          id = question.id;
          subject = question.subject;
          chapter = question.chapter;
          difficulty = question.difficulty;
          questionText = question.questionText;
          options = updatedOptions;
          correctAnswer = question.correctAnswer;
          explanation = question.explanation;
          image = question.image;
          createdBy = question.createdBy;
          createdAt = question.createdAt;
          updatedAt = ?Time.now();
          classLevel = question.classLevel;
        };

        questionBank.add(questionId, updatedQuestion);
      };
    };
  };

  public shared ({ caller }) func removeOptionImageFromQuestion(questionId : Nat, optionIndex : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove option images");
    };

    switch (questionBank.get(questionId)) {
      case (null) { Runtime.trap("Question not found") };
      case (?question) {
        if (optionIndex >= question.options.size()) {
          Runtime.trap("Option index out of bounds");
        };

        let updatedOptions = Array.tabulate(
          question.options.size(),
          func(i) {
            if (i == optionIndex) {
              let originalOption = question.options[i];
              {
                text = originalOption.text;
                image = null;
              };
            } else {
              question.options[i];
            };
          },
        );

        let updatedQuestion = {
          id = question.id;
          subject = question.subject;
          chapter = question.chapter;
          difficulty = question.difficulty;
          questionText = question.questionText;
          options = updatedOptions;
          correctAnswer = question.correctAnswer;
          explanation = question.explanation;
          image = question.image;
          createdBy = question.createdBy;
          createdAt = question.createdAt;
          updatedAt = ?Time.now();
          classLevel = question.classLevel;
        };

        questionBank.add(questionId, updatedQuestion);
      };
    };
  };

  public query ({ caller }) func getActiveSessionCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access system metrics");
    };
    activeSessions.size();
  };

  public query ({ caller }) func getSystemMetrics() : async SystemMetrics {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access system metrics");
    };

    {
      activeSessionCount = activeSessions.size();
      totalUsers = userProfiles.size();
      totalQuestions = questionBank.size();
      totalTests = testConfigs.size();
      timestamp = Time.now();
    };
  };

  public query ({ caller }) func getActiveSessions() : async [ActiveSession] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view active sessions");
    };
    activeSessions.values().toArray();
  };

  public shared ({ caller }) func cleanupStaleSessions(maxIdleMinutes : Nat) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can cleanup sessions");
    };

    let now = Time.now();
    let maxIdleNanos = maxIdleMinutes * 60 * 1_000_000_000;
    var cleanedCount = 0;

    let sessions = activeSessions.entries().toArray();
    for ((userId, session) in sessions.vals()) {
      if (Int.abs(now - session.lastActivity) > maxIdleNanos) {
        activeSessions.remove(userId);
        cleanedCount += 1;
      };
    };

    cleanedCount;
  };

  public query ({ caller }) func getTestConfigOrder() : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test config order");
    };

    requireNotBlocked(caller);

    testConfigOrder;
  };

  public shared ({ caller }) func deleteTestConfig(testId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete test configs");
    };

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?_) {
        testConfigs.remove(testId);

        testConfigOrder := testConfigOrder.filter(
          func(id) {
            id != testId;
          }
        );
      };
    };
  };

  public shared ({ caller }) func reorderTestConfigs(newOrder : [Nat]) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reorder test configs");
    };

    let allConfigs = testConfigs.values().toArray();
    if (newOrder.size() != allConfigs.size()) {
      Runtime.trap("New order size does not match number of test configs");
    };

    for (id in newOrder.vals()) {
      if (not testConfigs.containsKey(id)) {
        Runtime.trap("Test config ID " # id.toText() # " does not exist");
      };
    };

    testConfigOrder := newOrder;
  };

  public query ({ caller }) func getOrderedTestConfigs() : async [TestConfig] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test configs");
    };

    requireNotBlocked(caller);

    let orderedConfigs = testConfigOrder.map(
      func(id) {
        switch (testConfigs.get(id)) {
          case (null) {
            Runtime.trap("Test config not found (ID: " # id.toText() # ")");
          };
          case (?config) { config };
        };
      }
    );

    if (AccessControl.isAdmin(accessControlState, caller)) {
      orderedConfigs;
    } else {
      orderedConfigs.filter(func(config) { config.isPublished });
    };
  };

  public query ({ caller }) func getTestConfigsInOrder() : async [TestConfig] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test configs");
    };

    requireNotBlocked(caller);

    let orderedConfigs = testConfigOrder.map(
      func(id) {
        switch (testConfigs.get(id)) {
          case (null) {
            Runtime.trap("Test config not found (ID: " # id.toText() # ")");
          };
          case (?config) { config };
        };
      }
    );

    if (AccessControl.isAdmin(accessControlState, caller)) {
      orderedConfigs;
    } else {
      orderedConfigs.filter(func(config) { config.isPublished });
    };
  };

  public shared ({ caller }) func getQuestionsForGallery(
    subject : ?Text,
    chapter : ?Text,
    difficulty : ?Text,
    classLevel : ?TestType,
    page : Nat,
    pageSize : Nat,
  ) : async {
    questions : [GalleryQuestionPreview];
    totalCount : Nat;
    pageCount : Nat;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view question gallery");
    };

    let allQuestions = questionBank.values().toArray();

    let filteredQuestions = allQuestions.filter(
      func(q) {
        let subjectMatch = switch (subject) {
          case (null) { true };
          case (?s) { Text.equal(q.subject, s) };
        };
        let chapterMatch = switch (chapter) {
          case (null) { true };
          case (?c) { Text.equal(q.chapter, c) };
        };
        let difficultyMatch = switch (difficulty) {
          case (null) { true };
          case (?d) { Text.equal(q.difficulty, d) };
        };
        let classLevelMatch = switch (classLevel) {
          case (null) { true };
          case (?cl) { q.classLevel == cl };
        };
        subjectMatch and chapterMatch and difficultyMatch and classLevelMatch
      }
    );

    let previews = filteredQuestions.map(
      func(question) {
        let snippetLength = 75;
        let hasImage = switch (question.image) {
          case (?_) { true };
          case (null) { false };
        };
        {
          id = question.id;
          subject = question.subject;
          chapter = question.chapter;
          difficulty = question.difficulty;
          questionText = question.questionText;
          hasImage;
          previewImage = question.image;
          options = question.options;
          snippet = if (question.questionText.size() > snippetLength) {
            Text.fromArray(question.questionText.toArray().sliceToArray(0, snippetLength));
          } else {
            question.questionText;
          };
        };
      }
    );

    let totalCount = previews.size();
    let startIdx = page * pageSize;
    let endIdx = if ((startIdx + pageSize) > totalCount) {
      totalCount;
    } else {
      startIdx + pageSize;
    };

    let pagedQuestions = if (endIdx <= totalCount) {
      previews.sliceToArray(startIdx, endIdx);
    } else {
      [];
    };

    let pageCount = (totalCount / pageSize) + (if (totalCount % pageSize != 0) { 1 } else { 0 });

    {
      questions = pagedQuestions;
      totalCount;
      pageCount;
    };
  };

  public query ({ caller }) func filterQuestions(
    subject : ?Text,
    chapter : ?Text,
    difficulty : ?Text,
    classLevel : ?TestType,
  ) : async [GalleryQuestionPreview] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can filter questions");
    };

    let allQuestions = questionBank.values().toArray();

    let filteredQuestions = allQuestions.filter(
      func(q) {
        let subjectMatch = switch (subject) {
          case (null) { true };
          case (?s) { Text.equal(q.subject, s) };
        };
        let chapterMatch = switch (chapter) {
          case (null) { true };
          case (?c) { Text.equal(q.chapter, c) };
        };
        let difficultyMatch = switch (difficulty) {
          case (null) { true };
          case (?d) { Text.equal(q.difficulty, d) };
        };
        let classLevelMatch = switch (classLevel) {
          case (null) { true };
          case (?cl) { q.classLevel == cl };
        };
        subjectMatch and chapterMatch and difficultyMatch and classLevelMatch
      }
    );

    filteredQuestions.map(
      func(question) {
        {
          id = question.id;
          subject = question.subject;
          chapter = question.chapter;
          difficulty = question.difficulty;
          questionText = question.questionText;
          hasImage = switch (question.image) {
            case (?_) { true };
            case (null) { false };
          };
          previewImage = question.image;
          options = question.options;
          snippet = Text.fromArray(question.questionText.toArray().sliceToArray(0, 75));
        };
      }
    );
  };

  public query ({ caller }) func getQuestionPreview(questionId : Nat) : async GalleryQuestionPreview {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view question previews");
    };

    switch (questionBank.get(questionId)) {
      case (null) { Runtime.trap("Question not found") };
      case (?question) {
        {
          id = question.id;
          subject = question.subject;
          chapter = question.chapter;
          difficulty = question.difficulty;
          questionText = question.questionText;
          hasImage = switch (question.image) {
            case (?_) { true };
            case (null) { false };
          };
          previewImage = question.image;
          options = question.options;
          snippet = Text.fromArray(question.questionText.toArray().sliceToArray(0, 75));
        };
      };
    };
  };

  public query ({ caller }) func getQuestionsByIds(questionIds : [Nat]) : async [GalleryQuestionPreview] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view questions");
    };

    let results = List.empty<GalleryQuestionPreview>();

    for (questionId in questionIds.vals()) {
      switch (questionBank.get(questionId)) {
        case (null) { /* skip */ };
        case (?question) {
          results.add({
            id = question.id;
            subject = question.subject;
            chapter = question.chapter;
            difficulty = question.difficulty;
            questionText = question.questionText;
            hasImage = switch (question.image) {
              case (?_) { true };
              case (null) { false };
            };
            previewImage = question.image;
            options = question.options;
            snippet = Text.fromArray(question.questionText.toArray().sliceToArray(0, 75));
          });
        };
      };
    };
    results.toArray();
  };

  public query ({ caller }) func getFilteredQuestionsCount(
    subject : ?Text,
    chapter : ?Text,
    difficulty : ?Text,
    classLevel : ?TestType,
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view question counts");
    };

    let allQuestions = questionBank.values().toArray();

    let filteredQuestions = allQuestions.filter(
      func(q) {
        let subjectMatch = switch (subject) {
          case (null) { true };
          case (?s) { Text.equal(q.subject, s) };
        };
        let chapterMatch = switch (chapter) {
          case (null) { true };
          case (?c) { Text.equal(q.chapter, c) };
        };
        let difficultyMatch = switch (difficulty) {
          case (null) { true };
          case (?d) { Text.equal(q.difficulty, d) };
        };
        let classLevelMatch = switch (classLevel) {
          case (null) { true };
          case (?cl) { q.classLevel == cl };
        };
        subjectMatch and chapterMatch and difficultyMatch and classLevelMatch
      }
    );
    filteredQuestions.size();
  };

  public query ({ caller }) func getAllUsersWithTestAttempts() : async [(UserProfile, [TestAttempt])] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view user data");
    };

    let entries = userProfiles.toArray();
    let usersWithAttempts = entries.map(
      func((_, userProfile)) {
        (userProfile, userProfile.testAttempts);
      }
    );

    usersWithAttempts;
  };

  public shared ({ caller }) func publishTestConfig(testId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can publish tests");
    };

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?existing) {
        let updatedConfig = { existing with isPublished = true; isStopped = false };
        testConfigs.add(testId, updatedConfig);
      };
    };
  };

  public shared ({ caller }) func unpublishTestConfig(testId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can unpublish tests");
    };

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?existing) {
        let updatedConfig = { existing with isPublished = false };
        testConfigs.add(testId, updatedConfig);
      };
    };
  };

  public shared ({ caller }) func stopTestConfig(testId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can stop tests");
    };

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?existing) {
        let updatedConfig = { existing with isStopped = true };
        testConfigs.add(testId, updatedConfig);
      };
    };
  };

  public shared ({ caller }) func scheduleTestConfig(testId : Nat, startTime : Time.Time, endTime : Time.Time) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can schedule tests");
    };

    if (endTime <= startTime) {
      Runtime.trap("End time must be after start time");
    };

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?existing) {
        let updatedConfig = { existing with startTime = ?startTime; endTime = ?endTime };
        testConfigs.add(testId, updatedConfig);
      };
    };
  };

  public query ({ caller }) func getTestStatus(testId : Nat) : async TestStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check test status");
    };

    requireNotBlocked(caller);

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test config not found") };
      case (?config) {
        if (not config.isPublished and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Test config is not published");
        };
        getTestStatusInternal(config, Time.now());
      };
    };
  };

  public query ({ caller }) func getAllTestsWithStatus() : async [(TestConfig, TestStatus)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view test statuses");
    };

    requireNotBlocked(caller);

    let now = Time.now();
    let configs = testConfigs.values().toArray();

    let visibleConfigs = if (AccessControl.isAdmin(accessControlState, caller)) {
      configs;
    } else {
      configs.filter(func(config) { config.isPublished });
    };

    visibleConfigs.map(
      func(config) {
        let status = getTestStatusInternal(config, now);
        (config, status);
      }
    );
  };

  private func getTestStatusInternal(config : TestConfig, currentTime : Time.Time) : TestStatus {
    if (config.isStopped) {
      #finished;
    } else {
      switch (config.startTime, config.endTime) {
        case (?start, ?end) {
          if (currentTime < start) { #scheduled }
          else if (currentTime >= start and currentTime <= end) {
            #live;
          } else { #ended };
        };
        case (_) { #live };
      };
    };
  };

  public shared ({ caller }) func setYouTubeVerified() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can verify YouTube subscription");
    };

    requireNotBlocked(caller);

    updateYouTubeVerification(caller);
  };

  public shared ({ caller }) func setYouTubeVerifiedForUser(userId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can manually verify YouTube subscription for other users");
    };
    updateYouTubeVerification(userId);
  };

  func updateYouTubeVerification(userId : Principal) {
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) {
        let updatedProfile : UserProfile = { profile with isYouTubeVerified = true; youtubeVerificationTimestamp = ?Time.now() };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func blockUser(userId : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can block users");
    };

    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) {
        let updatedProfile : UserProfile = { profile with isBlocked = true; blockTimestamp = ?Time.now() };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func unblockUser(userId : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can unblock users");
    };

    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) {
        let updatedProfile : UserProfile = { profile with isBlocked = false; blockTimestamp = null };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  public query ({ caller }) func isUserBlocked(userId : Principal) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller) or userId == caller)) {
      Runtime.trap("Unauthorized: Can only check your own block status or admin can check any user");
    };

    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) { profile.isBlocked };
    };
  };

  public query ({ caller }) func getBlockedUsers() : async [UserProfile] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can get blocked users");
    };
    userProfiles.values().toArray().filter(
      func(profile) { profile.isBlocked }
    );
  };

  public query ({ caller }) func getActiveNonBlockedUsers() : async [UserProfile] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can get active users");
    };
    userProfiles.values().toArray().filter(
      func(profile) { not profile.isBlocked }
    );
  };

  // Suggestion Feature Implementation

  public shared ({ caller }) func submitSuggestion(author : Text, feedback : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit suggestions");
    };

    requireNotBlocked(caller);

    if (Text.equal(feedback, "") or Text.equal(author, "")) {
      Runtime.trap("Feedback text and author cannot be empty");
    };

    let trimmedFeedback = if (feedback.size() > 250) {
      Text.fromArray(feedback.toArray().sliceToArray(0, 250));
    } else {
      feedback;
    };

    let suggestion : Suggestion = {
      id = nextSuggestionId;
      author;
      feedback = trimmedFeedback;
      timestamp = Time.now();
    };

    suggestions.add(nextSuggestionId, suggestion);
    nextSuggestionId += 1;
  };

  public query ({ caller }) func getAllSuggestions() : async SuggestionsResponse {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view suggestions");
    };

    let values = suggestions.values().toArray();
    let sorted = values.sort(
      func(a, b) {
        let diff = b.timestamp - a.timestamp;
        if (diff == 0) {
          #equal;
        } else if (diff > 0) {
          #greater;
        } else { #less };
      }
    );

    {
      suggestions = sorted;
      count = sorted.size();
    };
  };

  public shared ({ caller }) func deleteSuggestion(suggestionId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete suggestions");
    };

    if (not suggestions.containsKey(suggestionId)) {
      Runtime.trap("Suggestion not found");
    };

    suggestions.remove(suggestionId);
  };

  // Comment Feature Implementation

  public shared ({ caller }) func addComment(questionId : Nat, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can post comments");
    };

    requireNotBlocked(caller);

    if (Text.equal(text, "")) {
      Runtime.trap("Comment text cannot be empty");
    };

    let cleanedText = if (text.size() > 250) {
      Text.fromArray(text.toArray().sliceToArray(0, 250));
    } else {
      text;
    };

    switch (questionBank.get(questionId)) {
      case (null) { Runtime.trap("Question not found") };
      case (?_) {
        let comment : Comment = {
          id = nextCommentId;
          questionId;
          userId = caller;
          text = cleanedText;
          timestamp = Time.now();
        };
        comments.add(nextCommentId, comment);
        nextCommentId += 1;
      };
    };
  };

  public query ({ caller }) func getComments(questionId : Nat) : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view comments");
    };

    requireNotBlocked(caller);

    switch (questionBank.get(questionId)) {
      case (null) { Runtime.trap("Question not found") };
      case (?_) {
        let filteredComments = comments.values().toArray().filter(
          func(comment) { comment.questionId == questionId }
        );

        let sortedComments = filteredComments.sort(
          func(a, b) {
            let diff = b.timestamp - a.timestamp;
            if (diff == 0) {
              #equal;
            } else if (diff > 0) {
              #greater;
            } else { #less };
            // Newest first
          }
        );

        sortedComments;
      };
    };
  };

  public query ({ caller }) func getComment(commentId : Nat) : async Comment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view comments");
    };

    requireNotBlocked(caller);

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete comments");
    };

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?_) {
        comments.remove(commentId);
      };
    };
  };

  public query ({ caller }) func getAllComments() : async [Comment] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all comments");
    };
    comments.values().toArray();
  };

  // Leaderboard Feature Implementation

  public query ({ caller }) func getLeaderboardByTest(testId : Nat) : async [LeaderboardEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leaderboards");
    };

    requireNotBlocked(caller);

    switch (testConfigs.get(testId)) {
      case (null) { Runtime.trap("Test not found") };
      case (?_) {
        let allProfiles = userProfiles.values().toArray();

        let nonBlockedProfiles = allProfiles.filter(
          func(profile) { not profile.isBlocked }
        );

        let testAttempts = List.empty<(UserProfile, TestAttempt)>();
        for (profile in nonBlockedProfiles.vals()) {
          for (attempt in profile.testAttempts.vals()) {
            if (attempt.testId == testId) {
              testAttempts.add((profile, attempt));
            };
          };
        };

        let attemptsArray = testAttempts.toArray();
        let sortedAttempts = attemptsArray.sort(
          func(a, b) {
            let diff = b.1.score - a.1.score;
            if (diff == 0) {
              #equal;
            } else if (diff > 0) {
              #greater;
            } else { #less };
            // Highest score first
          }
        );

        let leaderboard = Array.tabulate(
          sortedAttempts.size(),
          func(i) {
            let (profile, attempt) = sortedAttempts[i];
            {
              userProfile = profile;
              score = attempt.score;
              rank = i + 1;
              submittedAt = attempt.submittedAt;
            };
          }
        );

        leaderboard;
      };
    };
  };

  public query ({ caller }) func getOverallLeaderboard() : async [OverallLeaderboardEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leaderboards");
    };

    requireNotBlocked(caller);

    let allProfiles = userProfiles.values().toArray();

    let nonBlockedProfiles = allProfiles.filter(
      func(profile) { not profile.isBlocked }
    );

    let userAverages = List.empty<(UserProfile, Float, Nat)>();
    for (profile in nonBlockedProfiles.vals()) {
      if (profile.testAttempts.size() > 0) {
        var totalScore : Float = 0.0;
        for (attempt in profile.testAttempts.vals()) {
          totalScore += attempt.score;
        };
        let averageScore = totalScore / profile.testAttempts.size().toFloat();
        userAverages.add((profile, averageScore, profile.testAttempts.size()));
      };
    };

    let averagesArray = userAverages.toArray();
    let sortedAverages = averagesArray.sort(
      func(a, b) {
        let diff = b.1 - a.1;
        if (diff == 0) {
          #equal;
        } else if (diff > 0) {
          #greater;
        } else { #less };
        // Highest average first
      }
    );

    let leaderboard = Array.tabulate(
      sortedAverages.size(),
      func(i) {
        let (profile, avgScore, totalAttempts) = sortedAverages[i];
        {
          userProfile = profile;
          averageScore = avgScore;
          totalAttempts;
          rank = i + 1;
        };
      }
    );

    leaderboard;
  };
};
