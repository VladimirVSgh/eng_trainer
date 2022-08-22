/**
 * Created by VladimirVS on 27.01.2015.
 */

angular.module("myApp", [])

.service("numbers", function() {

    this.toEnglish = function(value) {
        var names = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
        var names20 = ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
        var names10 = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
        var v1 = value[0] * 1;
        var v2 = value[1] * 1;
        if (v1 === 1) { return names10[v2]; }
        return names20[v1 - 2] + " " + names[v2];
    };

})

.service("randomQuestion", function(numbers) {
    var testNames = [test1Data, test2Data, test3Data, test4Data, test5Data, test6Data, test7Data];
    this.question = "";
    this.answer = "";
    var lastIndexes = [];
    var lastVals = [];

    this.next = function(testId, reverse, hideTransc) {

        function answerForQuestion(question) {
            var arr = [];
            for (var i = 0; i < m.length; i++) {
                if (m[i][rIndex] !== question) { continue; }
                arr.push(m[i][1 - rIndex]);
            }
            return arr.join(";");
        }

        if (testId === 8) { // special test for numbers
            var val = -1;
            do { val = Math.round(Math.random() * 89) + 10 + ""; }
            while (lastVals.indexOf(val) > -1);
            if (lastVals.length > 9) { lastVals.shift(); }
            lastVals.push(val);
            if (reverse) {
                this.question = numbers.toEnglish(val);
                this.answer = [val];
            }
            else {
                this.question = val;
                this.answer = [numbers.toEnglish(val)];
            }
            return;
        }

        var m = testNames[testId - 1];
        var index = -1;
        do { index = Math.round((m.length - 1) * Math.random()); }
        while (lastIndexes.indexOf(index) > -1);
        if (lastIndexes.length > 9) { lastIndexes.shift(); }
        lastIndexes.push(index);
        var rIndex = reverse ? 1 : 0;
        this.question = m[index][rIndex];
        this.answer = answerForQuestion(this.question);
        if (hideTransc) {
            this.question = this.question.replace(/\(.*\)/g, "");
            this.answer = this.answer.replace(/\(.*\)/g, "");
        }
        this.answer = this.answer.split(";");
    };
})

.service("speaker", function() {
    var voices = window.speechSynthesis.getVoices();
    setTimeout(function() { voices = window.speechSynthesis.getVoices(); }, 1000);

    function findVoice(lang) {
        //var voices = window.speechSynthesis.getVoices();
        for (var i = 0; i < voices.length; i++) {
            if (voices[i].lang === lang) { return voices[i]; }
        }
        return null;
    }

    this.speak = function(s) {
        if (!window.speechSynthesis) { return; }
        var utterance = new SpeechSynthesisUtterance(s);
        //utterance.rate = 0.1;
        if (s[0]>="0" && s[0]<="9") { utterance.lang = "ru-RU"; }
        else if ((s[0]<"a" || s[0]>"z") && (s[0]<"A" || s[0]>"Z")) { utterance.lang = "ru-RU"; }
        else { utterance.lang = "en-US"; }
        utterance.voice = findVoice(utterance.lang);
        window.speechSynthesis.speak(utterance);
    };
})

.service("settings", function() {
    this.answerTime = -1;
    this.nextTime = -1;
    this.speakMode = false;
    this.hideTransc = false;
})

.controller("menuCtrl", function($scope) {
    var headers = {test1: "Времена глаголов", test2: "Слова", test3: "Неправильные глаголы", test4: "Времена to be",
        test5: "Выражения", test6: "Предложения", test7: "Послелоги", test8: "Числа"};
    $scope.activeItem = "";
    $scope.header = "";
    $scope.collapsed = true;

    $scope.changeItem = function(s) {
        $scope.activeItem = s;
        $scope.header = headers[s];
        $scope.$broadcast('changeItem', s);
        $scope.collapsed = true;
    };

    $scope.changeItem("test1");
})

.controller("testCtrl", function($scope, $timeout, randomQuestion, speaker, settings) {
    $scope.question = "";
    $scope.answer = [];
    $scope.userAnswer = "";
    $scope.showAnswer = false;
    $scope.testId = 1;
    $scope.reverse = false;
    var stop = null;

    $scope.getAnswer = function() {
        $scope.showAnswer = true;
        if (settings.speakMode) { $scope.speak($scope.answer[0]); }
        if (settings.nextTime > 0) {
            if (stop) { $timeout.cancel(stop); }
            stop = $timeout(function() { $scope.nextQuestion(); }, settings.nextTime * 1000);
        }
    };

    $scope.nextQuestion = function() {
        randomQuestion.next($scope.testId, $scope.reverse, settings.hideTransc);
        $scope.question = randomQuestion.question;
        $scope.answer = randomQuestion.answer;
        $scope.showAnswer = false;
        $scope.userAnswer = "";
        if (settings.speakMode) { $scope.speak($scope.question); }
        if (settings.answerTime > 0) {
            if (stop) { $timeout.cancel(stop); }
            stop = $timeout(function() { $scope.getAnswer(); }, settings.answerTime * 1000);
        }
    };

    $scope.speak = function(s) { speaker.speak(s); };

    $scope.$on('changeItem', function(event, s) {
        if (s.substring(0, 4) !== "test") { $scope.testId = -1; return; }
        var id = s[4] * 1;
        if (id === $scope.testId) { return; }
        $scope.testId = id;
        $scope.nextQuestion();
    });

    $scope.nextQuestion();
})

.controller("settingsCtrl", function($scope, settings) {
    $scope.timeOptions = [{name: "Только вручную", value: -1}, {name: "Через 2 секунды", value: 2},
        {name: "Через 3 секунды", value: 3}, {name: "Через 5 секунд", value: 5}, {name: "Через 10 секунд", value: 10}];
    $scope.answerTime = $scope.timeOptions[0];
    $scope.nextTime = $scope.timeOptions[0];
    $scope.speakMode = settings.speakMode;
    $scope.hideTransc = settings.hideTransc;

    $scope.change = function() {
        settings.answerTime = $scope.answerTime.value;
        settings.nextTime = $scope.nextTime.value;
        settings.speakMode = $scope.speakMode;
        settings.hideTransc = $scope.hideTransc;
    };
});
