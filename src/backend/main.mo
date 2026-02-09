import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import List "mo:core/List";
import Nat "mo:core/Nat";
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

  public shared query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profiles");
    };
    userProfiles.get(caller);
  };

  public shared query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
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
};
