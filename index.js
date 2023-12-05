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
    database: 'datalab',
    dateStrings: 'date'
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
        background-color: #f5f5f5;
        padding: 10px;
        border: 1px solid #cccccc;
    }
    table {
        border-collapse: collapse;
        margin: 1rem;
        background-color: white;
    }
    th, td {
        padding: 8px;
        text-align: center;
        border-bottom: 1px solid #ddd;
    }
    th {
        background-color: #e6eaf8;
        color: #000000;
    }
    tr:nth-child(even) {
        background-color: #f4f6f7;
    }
    li {
        background-color: #abebc6;
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

const pageFormPrefix = `<div><form action="`;
const pageFormSuffix = `" accept-charset="utf-8" method="get">
<input type="text" name="stdid">
<input type="submit" value="검색">
</form></div><br>`;

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
    const formActionName = `/`;

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageFormPrefix;
    pageOut += formActionName;
    pageOut += pageFormSuffix;
    pageOut += `<table>
    <th>학번</th>
    <th>이름</th>
    <th>학위과정</th>
    <th>출근일수</th>
    <th>총근무시간</th>
    <th>잔여반차</th>`;

    // 학번, 이름, 학위과정, 출근일수, 총근무시간, 잔여반차
    //let tupleList = [];
    let query = `SELECT stdId, name, course, (SELECT COUNT(*) FROM Attendance WHERE Attendance.sid = Members.stdId) attDay
    FROM Members`;
    if ((stdId != undefined) && (stdId.length != 0)) {
        query += ` WHERE stdId=${stdId}`;
        //console.log(query);
    }
    connection.query(query, (error, rows, fields) => {
        if (error) throw error;
        // console.log(rows);
        rows.forEach((row) => {
            course = courseTab[row.course];
            pageOut += `<tr>`;
            pageOut += `<td>${row.stdId}</td><td>${row.name}</td><td>${course}</td><td>${row.attDay}</td>`;
            pageOut += `<td></td><td></td>`;
            pageOut += `</tr>`;
        });
        pageOut += '</table>';
        pageOut += pageSuffix;
        res.send(pageOut);
    });
});

app.get('/detailed', (req, res) => {
    console.log("근태현황 상세");
    let stdId = req.query.stdid;
    const formActionName = `/detailed`;

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageFormPrefix;
    pageOut += formActionName;
    pageOut += pageFormSuffix;
    pageOut += `<table>
    <th>학번</th>
    <th>이름</th>
    <th>학위과정</th>
    <th>날짜</th>
    <th>출근</th>
    <th>퇴근</th>
    <th>근무시간</th>
    <th>비고</td>`;
    // 학번, 이름, 학위과정, 날짜, 출근, 퇴근, 근무시간, 비고
    let query = `
    SELECT stdId, name, course, attDate, arrivalTime, leaveTime, SUBTIME(leaveTime, arrivalTime) workTime
    FROM Members mem
        INNER JOIN Attendance att
        ON mem.stdId = att.sid
    ORDER BY attDate ASC, arrivalTime ASC`;
    console.log(query);

    if ((stdId != undefined) && (stdId.length != 0)) {
        query = `
        SELECT stdId, name, course, attDate, arrivalTime, leaveTime, SUBTIME(leaveTime, arrivalTime) workTime
        FROM Members mem
            INNER JOIN Attendance att
            ON mem.stdId = att.sid
        WHERE stdId = ${stdId}
        `;
    }

    connection.query(query, (error, rows, fields) => {
        if (error) throw error;
        // console.log(rows);
        rows.forEach((row) => {
            let arrivalDatetime = `${row.attDate} ${row.arrivalTime}`;
            let leaveDatetime   = `${row.attDate} ${row.leaveTime}`;
            let status = getStatusFromTime(arrivalDatetime, leaveDatetime);

            course = courseTab[row.course];
            pageOut += `<tr>`;
            pageOut += `<td>${row.stdId}</td><td>${row.name}</td><td>${course}</td><td>${row.attDate}</td>`;
            pageOut += `<td>${row.arrivalTime}</td><td>${row.leaveTime}</td><td>${row.workTime}</td>`;
            pageOut += `<td>${status}</td>`;
            pageOut += `</tr>`;
        });
        pageOut += '</table>';
        pageOut += pageSuffix;
        res.send(pageOut);
    });

});

app.get('/late', (req, res) => {
    console.log("지각 내역");
    let stdId = req.query.stdid;
    let formActionName = `/late`;

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageFormPrefix;
    pageOut += formActionName;
    pageOut += pageFormSuffix;
    pageOut += `<table>
    <th>학번</th>
    <th>이름</th>
    <th>학위과정</th>
    <th>날짜</th>
    <th>출근</th>
    <th>퇴근</th>
    <th>합</th>
    <th>잔여반차</th>`;
    // 학번, 이름, 학위과정, 날짜, 출근, 퇴근, 합, 잔여 반차

    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/day-off', (req, res) => {
    console.log("연차 및 반차 사용 내역");
    let stdId = req.query.stdid;
    let formActionName = `/day-off`;

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageFormPrefix;
    pageOut += formActionName;
    pageOut += pageFormSuffix;
    pageOut += `<table>
    <th>학번</th>
    <th>이름</th>
    <th>학위과정</th>
    <th>구분</th>
    <th>날짜</th>
    <th>잔여반차</th>`;
    // 학번, 이름, 학위과정, 구분(연차/반차), 날짜, 잔여 반차
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/std-info', (req, res) => {
    console.log("학생 정보 조회");
    let stdId = req.query.stdid;
    let formActionName = `/std-info`;
    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageFormPrefix;
    pageOut += formActionName;
    pageOut += pageFormSuffix;
    
    pageOut += `<table>
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
});

app.get('/query', (req, res) => {
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
});

app.listen(portNum, () => {
    console.log('Express App on port ', portNum);
});

// Datetime 형식으로 입력
function getStatusFromTime(arrival, leave) {
    let flagAM = false;
    let flagPM = false;
    let da = new Date(arrival);
    let dl = new Date(leave);
    let arrTime = {
        'hour': da.getHours(),
        'min': da.getMinutes(),
        'sec': da.getSeconds()
    };
    let levTime = {
        'hour': dl.getHours(),
        'min': dl.getMinutes(),
        'sec': dl.getSeconds(),
    }
    // console.log(`출근: ${arrTime.hour}시 ${arrTime.min}분 ${arrTime.sec}초`);
    // console.log(`퇴근: ${levTime.hour}시 ${levTime.min}분 ${levTime.sec}초`);
    // 오전 반차 (출근 11:30-14:30)
    if ((arrTime.hour == 11 && arrTime.min > 30) || (arrTime.hour > 11)) {
        flagAM = true;
    }
    // 연차 (14:30 이후 출근 또는 14:30 이전 퇴근)
    if (((arrTime.hour == 14 && arrTime.min > 30) || (arrTime.hour > 14)) ||
        ((levTime.hour == 14) && (levTime.min < 30) || (levTime.hour < 13))) {
        flatAM = true;
        flagPM = true;
    }
    // 오후 반차 (퇴근 14:30-18:00)
    if ((levTime.hour == 14) && (levTime.min >= 30) || 
        ((levTime.hour > 14) && (levTime.hour < 18))) {
        flagPM = true;
    }

    if (flagAM && flagPM) {
        return '연차';
    }
    else if (flagAM) {
        return '오전반차';
    }
    else if (flagPM) {
        return '오후반차';
    }
    else {
        return '';
    }
}