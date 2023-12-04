const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'euntae',
    password: 'datalab1234!!',
    database: 'datalab'
});
connection.connect();

const portNum = 8000;
const urlPrefix = `http://localhost:${portNum}`;
const pagePrefix = `<!DOCTYPE html><html> 
    <head>
    <meta charset="UTF-8">
    <title>연구실 근태관리 시스템: 연근</title>
    <style>
        #title-logo {
            width: 100%;
            margin: 1em auto;
            background-color: #F5F5F5;
            padding: 10px;
            border: 1px solid #CCCCCC;
        }
    </style>
    </head> 
    <body> 
    
    <div id="title-logo">
        <h1>연구실 근태관리 시스템: 연근</h1>
        <h3>앉기 전에 지문 찍으셨나요?</h3>
        <a href="/">
            <img src="static/yeon.jpg" style="width: 240px; ">
        </a>
    </div>
    <div>
        <div class="tab">
            <ul class="tabnav">
                <li><a href="/">근태현황개요</a></li>
                <li><a href="/detailed">근태현황 상세</a></li>
                <li><a href="/late">지각 내역</a></li>
                <li><a href="/day-off">연차 및 반차 사용 내역</a></li>
                <li><a href="/std-info">학생 정보 조회</a></li>
            </ul>
        </div>
    </div>`;
const pageSuffix = `</body></html>`;

var pageOut = '';

// __dirname: 현재 프로젝트의 절대경로
// '/static': URL로 접근 시 /static 접두어가 붙어야 한다.
// 정적 파일을 제공할 디렉토리로 html과 images를 사용
app.use('/static', express.static(path.join(__dirname, 'html')));
app.use('/static', express.static(path.join(__dirname, 'images')));

app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, 'html', 'main.html'));
    console.log("근태현황개요");
    pageOut = '';
    pageOut += pagePrefix;
    pageOut += `<input type="text" id="sid-text">
    <input type="submit" id="sid-submit" value="검색">`;
    //pageOut += `<h3>학번, 이름, 학위과정, 출근일수, 총근무시간, 잔여반차</h3>`;
    pageOut += `<table border="1">
    <th>학번</th>
    <th>이름</th>
    <th>학위과정</th>
    <th>출근일수</th>
    <th>총근무시간</th>
    <th>잔여반차</th>`;

    // 학번, 이름, 학위과정, 출근일수, 총근무시간, 잔여반차
    connection.query('SELECT stdId, name, course FROM Members', (error, rows, fields) => {
        if (error) throw error;
        console.log("SELECT stdId, name, course FROM Members");
        rows.forEach((row) => {
            //console.log(`${row.name}'s ID is ${row.stdId}`);
            course = '';
            if (row.course === 'phd')
                course = '박사과정';
            else if (row.course === 'msd')
                course = '석사과정';
            else
                course = '인턴';
            pageOut += `<tr>`;
            pageOut += `<td>${row.stdId}</td><td>${row.name}</td><td>${course}</td>`;
            pageOut += `</tr>`;
        });
        pageOut += pageSuffix;
        res.send(pageOut);
    });
    // pageOut += pageSuffix;
    // res.send(pageOut);
});

app.get('/detailed', (req, res) => {
    console.log("근태현황 상세");
    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/late', (req, res) => {
    console.log("지각 내역");
    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/day-off', (req, res) => {
    console.log("연차 및 반차 사용 내역");
    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/std-info', (req, res) => {
    console.log("학생 정보 조회");
    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/query', (req, res) => {
    connection.query('SELECT * FROM Members', (error, rows, fields) => {
        if (error) throw error;
        //console.log('Members info is', rows);
        pageOut = '';
        pageOut += pagePrefix;
        pageOut += `<input type="text" id="sid-text">
        <input type="submit" id="sid-submit" value="검색">
        <h3>`;

        rows.forEach((row) => {
            //console.log(`${row.name}'s ID is ${row.stdId}`);
            pageOut += `${row.name}'s ID is ${row.stdId}<br>`;
        });

        pageOut += `</h3>`;
        pageOut += pageSuffix;
        
        res.send(pageOut);
    });

    //connection.end();
});

app.listen(portNum, () => {
    console.log('Express App on port ', portNum);
});
