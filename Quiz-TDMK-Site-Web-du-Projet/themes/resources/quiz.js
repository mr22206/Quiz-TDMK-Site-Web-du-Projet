(function (window, document) {
  'use strict';
  
  //variable principale qui va permettre le fonctionnement du quiz
  window.KTMD = {
    
    //statistique des exercices
    stats : {
      problems : 0,
        solved : 0, 
      mistakes : 0, 
         score : 0, 
       exclude : 0  
    },

    //permet de trouver les fichiers des quiz
    local : window.location.protocol == 'file:' ? 'index.html' : '',

    //permet d'afficher toutes les questions répondu
    scrollTo : function (el, delay) {

      if (typeof el == 'string') {
        el = document.querySelector(el);
      }

      var scroll = function () {
        document.body.scrollTop = el.offsetTop;
        document.documentElement.scrollTop = el.offsetTop;
      };

      if (delay) {
        setTimeout(scroll, 100);
      } else {
        scroll();
      }
    },

    generate : function (o) {
      var zone = document.getElementById('quiz-zone'), 
          quiz = '</div><div id="question-list">',
          answers = '<div id="answer-list">',
          option = 65,
          isAnswer = false,
          q = o.quiz,
          i = 0,
          j = q.length,
          n;
      
      //creer un block individuel pour chaque question et cache les précédentes
      var qNumber = 0;
      while (q.length) {
        i = Math.floor(Math.random() * q.length);
        
        quiz += '<div id="quiz-q' + qNumber + '" class="question-block" data-qid="' + (qNumber + 1) + '" style="display:none;"><div class="quiz-multi-question">' + (typeof q[i].question != 'undefined' ? q[i].question + (q[i].image ? '<img class="quiz-image" src="../../../resources/images/test-images/' + q[i].image + '" alt="' + q[i].image + '">' : '') : '<div class="text-passage' + (q[i].vertical ? ' vertical-text' : '') + '" ' + (q[i].text.replace(/<br>/g, '').length < 50 ? 'style="text-align:center;"' : '') + '>' + q[i].text + '</div>' + (q[i].helper || '')) + '</div>';

        if (q[i].text) {
          quiz += '<div class="quiz-multi-row"><button class="quiz-multi-answer next-question" onclick="KTMD.progress(this, true);">NEXT</button></div>';
          ++KTMD.stats.exclude;

        } else {

          while (q[i].answers.length) {
            n = Math.floor(Math.random() * q[i].answers.length);
           // les questions qui commence par un + sont les bonnes
            if (q[i].answers[n].charAt(0) == '+') {
              isAnswer = true;
              q[i].answers[n] = q[i].answers[n].slice(1);
            }

            quiz += '<div class="quiz-multi-row"><button class="quiz-multi-answer" data-answer="' + isAnswer + '" data-option="' + String.fromCharCode(option++) + '" onclick="KTMD.progress(this);">' + q[i].answers[n] + '</button></div>';
            isAnswer = false;

            q[i].answers.splice(n, 1);
          }
        }

        quiz += '</div>';
        option = 65; 
        ++KTMD.stats.problems; 
        q.splice(i, 1);
        qNumber++;
      }

      zone.innerHTML = quiz + '</div><div id="quiz-progress"><div id="quiz-progress-bar"></div></div>';

      KTMD.progress('init');
      //appelle du programme timer.js
      var timer = new Timer(),
          clock = document.getElementById('quiz-timer');
      //
      clock.innerHTML = '00:00:00';
      timer.start();
      timer.addEventListener('secondsUpdated', function (e) {
        clock.innerHTML = timer.getTimeValues().toString()
      });
      
      KTMD.timer = timer;

      document.getElementById('exercise').className += ' content-loaded ' + o.type + '-quiz';
      //remonter en haut à la fin du quiz
      KTMD.scrollTo('#exercise-title', true);
    },

    // barre de progression
    incrementProgressBar : function () {
      var bar = document.getElementById('quiz-progress-bar'),
          progress = Math.floor((KTMD.stats.solved+1) / KTMD.stats.problems * 100);

      bar.style.width = progress + '%';
      bar.innerHTML = '<span id="quiz-progress-text">' + (KTMD.stats.solved+1) + '/' + KTMD.stats.problems + '</span>';
    },

    progress : function (answer, exclude) {
      if (answer == 'init') {
        document.getElementById('quiz-q' + KTMD.stats.solved).style.display = '';
        KTMD.incrementProgressBar();

      } else {

        answer.className += ' selected-answer';

        if (exclude) {
          answer.parentNode.className += ' hidden-answer';
        }

        if (answer.dataset.answer == 'false') {
          answer.parentNode.parentNode.className += ' wrong-answer';
          ++KTMD.stats.mistakes;
        }

        var last = document.getElementById('quiz-q' + KTMD.stats.solved++),
            next = document.getElementById('quiz-q' + KTMD.stats.solved);

        if (next) {
          next.style.display = '';
          last.style.display = 'none';
          KTMD.incrementProgressBar();

        } else {
          KTMD.end();

          for (var q = document.querySelectorAll('[id^="quiz-q"]'), i = 0, j = q.length; i < j; i++) {
            q[i].style.display = '';
          }

          document.getElementById('quiz-progress').style.display = 'none';
        }
      }
    },


    // quiz fin correction
    end : function () {
      //nombre de pb résolue - le nombre de question évité
      var solved = KTMD.stats.solved - KTMD.stats.exclude,
          problems = KTMD.stats.problems - KTMD.stats.exclude;

      KTMD.stats.score = Math.floor((solved - KTMD.stats.mistakes) * 100 / problems);
      KTMD.timer.stop();

      var timer = document.getElementById('quiz-timer'),
          wrong = 'Les questions fausses sont en <span class="t-red">rouge</span>. Les questions qui n\'ont pas été trouvé sont en <span class="t-blue">bleu</span>. Et les questions juste sont en <span class="t-green">vert</span>.';
      timer.style.display = 'none';

      document.getElementById('quiz-result').innerHTML = 
      '<div id="complete-banner" class="center">Quiz Terminé !</div>'+
      '<div id="result-list">'+
        '<div class="result-row"><span class="result-label">Questions Répondues :</span>' + problems + '</div>'+ // nombre de questions répondus
        '<div class="result-row"><span class="result-label">Questions Fausses :</span>' + KTMD.stats.mistakes + '</div>'+ // nombres de questions fausses
        '<div class="result-row"><span class="result-label">Votre Score :</span>' + KTMD.stats.score + '%</div>'+ // le score final en pourcentage
        '<div class="result-row"><span class="result-label">Votre Temps :</span>' + timer.innerHTML + '</div>'+ // le temps qui été fait
        '<div class="result-row center">'+
          (// si le score est moins de 70% ça écrit "C'est bien" et si tout est juste ça écrit "Parfait"
            KTMD.stats.score == 100 ? 'Parfait ! Vous avez fait tout juste !' :
            KTMD.stats.score > 70 ? 'C\'est bien !' + wrong :
            'Dommage ! ' + wrong
          )+
          '<div class="center">'+
            '<a href="./' + KTMD.local + '" class="button">Réessayer</a>'+
            '<a href="' + document.getElementById('home-link').href + '" class="button">Retour au Menu</a>'+
          '</div>'+
        '</div>'+
      '</div>';
      //
      document.getElementById('exercise').className += ' quiz-over';
      //remonter tout en haut
      KTMD.scrollTo('#complete-banner', true);
    }
  };
}(window, document));