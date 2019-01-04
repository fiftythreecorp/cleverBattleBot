const fs = require("fs");
const cleverApi = require('node-cleverapi');
const Telegraf = require('telegraf');
const mysql = require('mysql');
const xss = require('xss')
	var pool = mysql.createPool({
	    connectionLimit: 500,
	    database: 'DB NAME',
	    host: 'DB HOST',
	    user: 'DB USER',
	    password: 'DB PASS'
	});

var cb = new cleverApi({
  login: 'BOT LOGIN',
  password: 'DB ',
  longpoll: false
});
var AccID = 2;
//var proxy = { server: , port: 22220, user: '',password: ''}

const query = (sql, data, callback) => {
    if (typeof callback === "undefined") {
        callback = function() {};
    }
    pool.getConnection((err, connection) => {
        if (err) return callback(err);

        connection.query(sql, data, (err, rows) => {
            if (err) return callback(err);
            connection.release();
            return callback(null, rows);
        });
    });
}
var question = {};
var baseAdd = 0;
cb.login().then(res => {

	cb.pollRandomGame();
	cb.on('battle_start', gameID => {
		console.log('gameID', gameID.id)
		baseAdd = 0;
	})
	cb.on('battle_question', questionData => {
		question = questionData;
		query("SELECT * FROM `questions` WHERE question = ?", [questionData.text], (err, row) => {
			if(err) console.log('sdfsdfsd', err);
			if(err || !row.length) {
				
				console.log('Вопроса нет в базе, отправляем ответ.')
				question.inBase = false;
				cb.anytimeSendAnswer(questionData.gameID, questionData.ind, 0);

			} else {

				question.inBase = true;
				answer_id = 0;
				answer_right = row[0].answer_right;
				for(aID in questionData.answers) {

					if(questionData.answers[aID].text == answer_right) {
						answer_id = questionData.answers[aID].id;
			
					}
				}
				
				console.log('Вопрос есть в базе, отправляем ответ.');
				cb.anytimeSendAnswer(questionData.gameID, questionData.ind, answer_id);

			}
		});
	})
	cb.on('battle_answer', answerID => {
	
		if(!question.inBase) {
			query('INSERT INTO questions SET question = "' + question.text + '", answer_1 = "' + question.answers[0].text + '", answer_2 = "' + question.answers[1].text + '", answer_3 = "' + question.answers[2].text + '", answer_right = "' + question.answers[answerID].text + '"', [], (err, row) => {
				if(err) {
					console.log(err)
					return console.log(question.text, question.answers[0].text, question.answers[1].text, question.answers[2].text, question.answers[answerID].text)
				} else {
					baseAdd++;
				}
			});
		}
	})

	cb.on('battle_end', end => {
		console.log('GAME_END', end);

	})

	cb.on('battle_error', error => {
		console.log('Ошибка', error);
	})


}).catch(err => {

	console.log('Ошибка авторизации', err);

})