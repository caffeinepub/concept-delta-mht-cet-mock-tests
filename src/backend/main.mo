import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import List "mo:core/List";

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
    score : Nat;
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
  public type TestType = { #class11; #class12; #completeSyllabus };

  type TestConfig = {
    id : Nat;
    name : Text;
    subject : Text;
    chapters : [Text];
    testType : TestType;
    durationMinutes : Nat;
    totalQuestions : Nat;
    markingScheme : {
      correctMarks : Nat;
      incorrectPenalty : Nat;
      penaltyOption : ?Text;
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

  public type SectionType = { #physicsChemistry; #mathematics; #full };

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
    score : Nat;
    rank : Nat;
    submittedAt : Time.Time;
  };

  public type OverallLeaderboardEntry = {
    userProfile : UserProfile;
    averageScore : Nat;
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

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let newProfile : UserProfile = {
      id = caller;
      fullName = profile.fullName;
      email = profile.email;
      mobileNumber = profile.mobileNumber;
      testAttempts = profile.testAttempts;
      createdAt = Time.now();
      lastLogin = Time.now();
      isYouTubeVerified = profile.isYouTubeVerified;
      youtubeVerificationTimestamp = profile.youtubeVerificationTimestamp;
      isBlocked = profile.isBlocked;
      blockTimestamp = profile.blockTimestamp;
    };

    userProfiles.add(caller, newProfile);
    newProfile;
  };

  public shared ({ caller }) func createQuestion(
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
      Runtime.trap("Unauthorized: Only admins can create questions");
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
    subject : Text,
    chapter : Text,
    difficulty : Text,
    questionText : Text,
    options : [Option],
    correctAnswer : Nat,
    explanation : ?Text,
    image : ?Storage.ExternalBlob,
    classLevel : TestType,
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update questions");
    };

    switch (questionBank.get(questionId)) {
      case (null) {
        Runtime.trap("Question not found");
      };
      case (?existingQuestion) {
        let updatedQuestion : Question = {
          id = questionId;
          subject;
          chapter;
          difficulty;
          questionText;
          options;
          correctAnswer;
          explanation;
          image;
          createdBy = existingQuestion.createdBy;
          createdAt = existingQuestion.createdAt;
          updatedAt = ?Time.now();
          classLevel;
        };
        questionBank.add(questionId, updatedQuestion);
      };
    };
  };

  public shared ({ caller }) func deleteQuestion(questionId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete questions");
    };
    questionBank.remove(questionId);

    for ((testId, config) in testConfigs.entries()) {
      let filteredQuestions = config.questions.filter(func(q) { q != questionId });
      let updatedConfig = { config with questions = filteredQuestions };
      testConfigs.add(testId, updatedConfig);
    };
  };

  public query ({ caller }) func getQuestion(questionId : Nat) : async ?Question {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view questions");
    };
    questionBank.get(questionId);
  };

  public query ({ caller }) func listQuestions(subjectFilter : ?Text) : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list questions");
    };

    let allQuestions = questionBank.values().toArray();

    switch (subjectFilter) {
      case (null) { allQuestions };
      case (?subject) {
        allQuestions.filter(func(q : Question) : Bool {
          q.subject == subject
        });
      };
    };
  };

  public query ({ caller }) func listQuestionsBySubject(subject : Text) : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list questions");
    };

    questionBank.values().toArray().filter(func(q : Question) : Bool {
      q.subject == subject
    });
  };

  public shared ({ caller }) func attachQuestionImage(questionId : Nat, imageBlob : Storage.ExternalBlob) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can attach images to questions");
    };

    switch (questionBank.get(questionId)) {
      case (null) {
        Runtime.trap("Question not found");
      };
      case (?question) {
        let updatedQuestion : Question = {
          question with
          image = ?imageBlob;
          updatedAt = ?Time.now();
        };
        questionBank.add(questionId, updatedQuestion);
      };
    };
  };

  public shared ({ caller }) func attachOptionImage(questionId : Nat, optionIndex : Nat, imageBlob : Storage.ExternalBlob) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can attach images to options");
    };

    switch (questionBank.get(questionId)) {
      case (null) {
        Runtime.trap("Question not found");
      };
      case (?question) {
        if (optionIndex >= question.options.size()) {
          Runtime.trap("Option index out of bounds");
        };

        let updatedOptions = Array.tabulate(
          question.options.size(),
          func(i : Nat) : Option {
            if (i == optionIndex) {
              {
                text = question.options[i].text;
                image = ?imageBlob;
              };
            } else {
              question.options[i];
            };
          },
        );

        let updatedQuestion : Question = {
          question with
          options = updatedOptions;
          updatedAt = ?Time.now();
        };
        questionBank.add(questionId, updatedQuestion);
      };
    };
  };

  public shared ({ caller }) func setYouTubeVerified() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set YouTube verification");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with
          isYouTubeVerified = true;
          youtubeVerificationTimestamp = ?Time.now();
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func submitSuggestion(author : Text, feedback : Text) : async Nat {
    let suggestion : Suggestion = {
      id = nextSuggestionId;
      author;
      feedback;
      timestamp = Time.now();
    };
    suggestions.add(nextSuggestionId, suggestion);
    nextSuggestionId += 1;
    suggestion.id;
  };

  public query ({ caller }) func listSuggestions() : async SuggestionsResponse {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view suggestions");
    };
    let suggestionList = suggestions.values().toArray();
    {
      suggestions = suggestionList;
      count = suggestionList.size();
    };
  };

  public shared ({ caller }) func deleteSuggestion(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete suggestions");
    };
    suggestions.remove(id);
  };

  public query ({ caller }) func listCommentsForQuestion(questionId : Nat) : async [Comment] {
    comments.values().toArray().filter(func(c) { c.questionId == questionId });
  };

  public shared ({ caller }) func postComment(questionId : Nat, text : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post comments");
    };

    let comment : Comment = {
      id = nextCommentId;
      questionId;
      userId = caller;
      text;
      timestamp = Time.now();
    };
    comments.add(nextCommentId, comment);
    nextCommentId += 1;
    comment.id;
  };

  public shared ({ caller }) func deleteComment(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete comments");
    };
    comments.remove(id);
  };

  public shared ({ caller }) func deleteExpiredUnpublishedTests() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let currentTime = Time.now();
    let filteredOrderList = List.empty<Nat>();

    for (testId in testConfigOrder.values()) {
      switch (testConfigs.get(testId)) {
        case (null) {};
        case (?config) {
          let testExpired = switch (config.endTime) {
            case (?endTime) { currentTime > endTime };
            case (null) { false };
          };

          if (not testExpired or config.isPublished) {
            filteredOrderList.add(testId);
          };
        };
      };
    };

    testConfigOrder := filteredOrderList.reverse().toArray();
  };

  public query ({ caller }) func getAllTestConfigsWithStatus() : async [(TestConfig, TestStatus)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all test configurations");
    };

    let now = Time.now();
    let sortedConfigs = testConfigOrder.map(func(id) { testConfigs.get(id) });

    let results : List.List<(TestConfig, TestStatus)> = List.empty<(TestConfig, TestStatus)>();

    for (configOpt in sortedConfigs.values()) {
      switch (configOpt) {
        case (null) {};
        case (?config) {
          let status = if (not config.isPublished) {
            #scheduled;
          } else if (switch (config.startTime) {
            case (?start) { now < start };
            case (null) { false };
          }) {
            #scheduled;
          } else {
            switch (config.endTime) {
              case (?end) {
                let twoHoursMicro = 2 * 60 * 60 * 1000000;
                if (now >= end and now < end + twoHoursMicro) {
                  #ended;
                } else if (now >= end) {
                  #finished;
                } else {
                  #live;
                };
              };
              case (null) { #live };
            };
          };
          results.add((config, status));
        };
      };
    };
    results.reverse().toArray();
  };

  public query ({ caller }) func getCurrentlyLiveTestsWithStatus() : async [(TestConfig, TestStatus)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view live tests");
    };

    let now = Time.now();
    let sortedConfigs = testConfigOrder.map(func(id) { testConfigs.get(id) });

    let filtered : List.List<(TestConfig, TestStatus)> = List.empty<(TestConfig, TestStatus)>();

    for (configOpt in sortedConfigs.values()) {
      switch (configOpt) {
        case (null) {};
        case (?config) {
          if (config.isPublished) {
            switch (config.startTime) {
              case (?start) {
                if (now >= start) {
                  switch (config.endTime) {
                    case (?end) {
                      let twoHoursMicro = 2 * 60 * 60 * 1000000;
                      if (now < end + twoHoursMicro) {
                        let status = if (now >= end) { #ended } else {
                          #live;
                        };
                        filtered.add((config, status));
                      };
                    };
                    case (null) {
                      filtered.add((config, #live));
                    };
                  };
                };
              };
              case (null) {
                filtered.add((config, #live));
              };
            };
          };
        };
      };
    };
    filtered.reverse().toArray();
  };
};
