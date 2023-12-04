const express = require('express');
const path = require('path');
const app = express();
//const bodyParser = require('body-parser');
//app.use(bodyParser.urlencoded({extended: true}));

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
        <h3><i>앉기 전에 지문 찍으셨나요?</i></h3>
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

const courseTab = {
    'und': '인턴',
    'msd': '석사과정',
    'phd': '박사과정'
};

// __dirname: 현재 프로젝트의 절대경로
// '/static': URL로 접근 시 /static 접두어가 붙어야 한다.
// 정적 파일을 제공할 디렉토리로 html과 images를 사용
app.use('/static', express.static(path.join(__dirname, 'html')));
app.use('/static', express.static(path.join(__dirname, 'images')));

app.get('/', (req, res) => {
    console.log("근태현황개요");

    let stdId = req.query.stdid;

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += `<div><form action="/" accept-charset="utf-8" method="get">
    <input type="text" name="stdid">
    <input type="submit" value="검색">
    </form></div>`;
    pageOut += `<br>`;
    pageOut += `<table border="1">
    <th>학번</th>
    <th>이름</th>
    <th>학위과정</th>
    <th>출근일수</th>
    <th>총근무시간</th>
    <th>잔여반차</th>`;

    // 학번, 이름, 학위과정, 출근일수, 총근무시간, 잔여반차
    //let tupleList = [];
    let query = 'SELECT stdId, name, course FROM Members';
    if ((stdId != undefined) && (stdId.length != 0)) {
        query += ` WHERE stdId=${stdId}`;
        //console.log(query);
    }
    connection.query(query, (error, rows, fields) => {
        if (error) throw error;

        rows.forEach((row) => {
            //console.log(`${row.name}'s ID is ${row.stdId}`);
            course = courseTab[row.course];
            pageOut += `<tr>`;
            pageOut += `<td>${row.stdId}</td><td>${row.name}</td><td>${course}</td>`;
            pageOut += `</tr>`;
        });
        pageOut += '</table>';
        pageOut += pageSuffix;
        res.send(pageOut);
    });
    
    // pageOut += pageSuffix;
    // res.send(pageOut);
});

app.get('/detailed', (req, res) => {
    console.log("근태현황 상세");
    let stdId = req.query.stdid;

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += `<div><form action="/detailed" accept-charset="utf-8" method="get">
    <input type="text" name="stdid">
    <input type="submit" value="검색">
    </form></div>`;
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/late', (req, res) => {
    console.log("지각 내역");
    let stdId = req.query.stdid;

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += `<div><form action="/late" accept-charset="utf-8" method="get">
    <input type="text" name="stdid">
    <input type="submit" value="검색">
    </form></div>`;

    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/day-off', (req, res) => {
    console.log("연차 및 반차 사용 내역");
    let stdId = req.query.stdid;

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += `<div><form action="/day-off" accept-charset="utf-8" method="get">
    <input type="text" name="stdid">
    <input type="submit" value="검색">
    </form></div>`;
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/std-info', (req, res) => {
    console.log("학생 정보 조회");
    let stdId = req.query.stdid;
    pageOut = '';
    pageOut += pagePrefix;
    pageOut += `<div><form action="/std-info" accept-charset="utf-8" method="get">
    <input type="text" name="stdid">
    <input type="submit" value="검색">
    </form></div><br>`;
    
    pageOut += `<table border="1">
    <th>학번</th>
    <th>이름</th>
    <th>학위과정</th>
    <th>이메일 주소</th>
    <th>전화번호</th>`;
    // 학번, 이름, 학위과정, 이메일 주소, 전화번호

    let query = 'SELECT stdId, name, course, email, phone FROM Members';
    if ((stdId != undefined) && (stdId.length != 0)) {
        query += ` WHERE stdId=${stdId}`;
    }
    connection.query(query, (error, rows, fields) => {
        if (error) throw error;
        rows.forEach((row) => {
            //console.log(`${row.name}'s ID is ${row.stdId}`);
            course = courseTab[row.course];
            pageOut += `<tr>`;
            pageOut += `<td>${row.stdId}</td>
            <td>${row.name}</td>
            <td>${course}</td>
            <td>${row.email}</td>
            <td>${row.phone}</td>`;
            pageOut += `</tr>`;
        });
        pageOut += '</table>';
        pageOut += pageSuffix;
        res.send(pageOut);
    });
    // pageOut += pageSuffix;
    // res.send(pageOut);
});

app.get('/query', (req, res) => {
    //let stdId = req.query.

    connection.query('SELECT * FROM Members', (error, rows, fields) => {
        if (error) throw error;
        //console.log('Members info is', rows);
        pageOut = '';
        pageOut += pagePrefix;

        rows.forEach((row) => {
            //console.log(`${row.name}'s ID is ${row.stdId}`);
            pageOut += `${row.name}'s ID is ${row.stdId}<br>`;
        });

        pageOut += pageSuffix;
        
        res.send(pageOut);
    });

    //connection.end();
});

app.listen(portNum, () => {
    console.log('Express App on port ', portNum);
});
