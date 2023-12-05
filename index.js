const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}));

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
    ul.tabnav {
        background-color: #e8f6f3
        margin: 0px;
        padding: 0px;
        list-style: none;
    }
    ul.tabnav li {
        background-color: #e8f8f5;
        display: inline-block;
        padding: 10px 15px;
    }
    ul.insert-form li {
        display: block;
        padding: 10px 10px;
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
            <li><a href="/insert-att-info">출퇴근 기록하기</a></li>
            <li><a href="/detailed">근태현황 상세</a></li>
<!--            <li><a href="/late">지각 내역</a></li> -->
            <li><a href="/day-off">연차 및 반차 사용 내역</a></li>
            <li><a href="/std-info">학생 정보 조회</a></li>
<!--            <li><a href="/insert-std-info">학생 정보 추가</a></li> -->
            <li><a href="/delete-std-info">학생 정보 삭제</a></li>
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

const doTypeTab = {
    1: '반차',
    2: '연차'
};

// __dirname: 현재 프로젝트의 절대경로
// '/static': URL로 접근 시 /static 접두어가 붙어야 한다.
// 정적 파일을 제공할 디렉토리로 html과 images를 사용
app.use('/static', express.static(path.join(__dirname, 'html')));
app.use('/static', express.static(path.join(__dirname, 'images')));

app.get('/', (req, res) => {
    let stdId = req.query.stdid;
    const formActionName = `/`;

    let pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageFormPrefix;
    pageOut += formActionName;
    pageOut += pageFormSuffix;
    pageOut += `<table>
    <th>학번</th>
    <th>이름</th>
    <th>학위과정</th>
    <th>출근일수</th>
    <th>총근무시간</th>`;

    // 학번, 이름, 학위과정, 출근일수, 총근무시간
    //let tupleList = [];
    let query = `
    SELECT stdId, name, course,
        COUNT(attDate) AS workDay, 
        SUM(HOUR(TIMEDIFF(leaveTime, arrivalTime))) AS workTime
    FROM Members AS mem 
        LEFT OUTER JOIN Attendance AS att
        ON mem.stdId = att.sid
    GROUP BY stdId`;
    if ((stdId != undefined) && (stdId.length != 0)) {
        query += ` HAVING stdId=${stdId}`;
        //console.log(query);
    }
    connection.query(query, (error, rows, fields) => {
        if (error) throw error;
        // console.log(rows);
        rows.forEach((row) => {
            let course = courseTab[row.course];
            let workTime = row.workTime;
            if (workTime == null)
                workTime = 0;
            pageOut += `<tr>`;
            pageOut += `<td>${row.stdId}</td><td>${row.name}</td><td>${course}</td>`;
            pageOut += `<td>${row.workDay}</td><td>${workTime}</td>`;
            pageOut += `</tr>`;
        });
        pageOut += '</table>';
        pageOut += pageSuffix;
        res.send(pageOut);
    });
});

app.get('/insert-att-info', (req, res) => {
    let pageOut = '';
    pageOut += pagePrefix;
    pageOut += `<div><form action="/insert-att-info" accept-charset="utf-8" method="post">
    <fieldset>
        <ul class="insert-form">
            <li>
                <label for="stdid">학번</label>
                <input type="text" pattern="[0-9]{9}" name="stdid" id="stdid">
            </li>
            <li>
                구분<br>
                <ul>
                    <li>
                        <label for="att-type-arrival">출근</label>
                        <input type="radio" name="att_type" id="att-type-arrival" value="arrival" checked>
                    </li>
                    <li>
                        <label for="att-type-leave">퇴근</label>
                        <input type="radio" name="att_type" id="att-type-leave" value="leave">
                    </li>
                </ul>
            </li>
            <li>
                <label for="att-date">날짜</label>
                <input type="date" name="att_date" id="att-date">
            </li>
            <li>
                <label for="att-time">시간</label>
                <input type="time" step="any" name="att_time" id="att-time" value="00:00:00">
            </li>
            <li>
                <input type="submit" value="제출">
            </li>
        </ul>
    </fieldset>
    </div>`;
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.post('/insert-att-info', (req, res) => {
    let msgSuffix = `window.location.replace('/insert-att-info');</script>`;
    let querySelect         = `SELECT * FROM Members WHERE stdId='${req.body.stdid}'`;
    let queryInsertArrival  = `INSERT INTO Attendance (attDate, sid, arrivalTime) VALUES ('${req.body.att_date}', ${req.body.stdid}, '${req.body.att_time}')`;
    let queryInsertLeave    = `UPDATE Attendance SET leaveTime='${req.body.att_time}' WHERE sid=${req.body.stdid} AND attDate='${req.body.att_date}'`;

    console.log(req.body);
    
    // 사용자가 존재하는지 검색
    connection.query(querySelect, (error, rows, fields) => {
        console.log(querySelect);
        if (error) throw error;
        console.log(rows);
        if (rows.length == 0) {
            let msg = `<script>alert('사용자를 찾을 수 없습니다.');`;
            msg += msgSuffix;
            return res.send(msg);
        }
        // 사용자가 존재할 경우 입력된 정보를 데이터베이스에 삽입
        if (req.body.att_type === 'arrival') { // 출근 처리
            connection.query(queryInsertArrival, (error, rows, fields) => {
                console.log(queryInsertArrival);
                if (error) throw error;

                let msg = `<script>alert('정상적으로 출근 처리되었습니다.');`;
                msg  += msgSuffix;
                return res.send(msg);
            });
        }
        else if (req.body.att_type === 'leave') { // 퇴근 처리
            connection.query(queryInsertLeave, (error, rows, fields) => {
                console.log(queryInsertLeave);
                if (error) throw error;

                let msg = `<script>alert('정상적으로 퇴근 처리되었습니다.');`;
                msg  += msgSuffix;
                return res.send(msg);
            });
        }
        else {
            let msg = `<script>alert('Error: 비정상적인 접근이 감지되었습니다.');`;
            msg += msgSuffix;
            return res.send(msg);
        }
    });
});

app.get('/detailed', (req, res) => {
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
        WHERE stdId = ${stdId}`;
        //query += ` HAVING stdId=${stdId}`;
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
    <th>퇴근</th>`;
    // 학번, 이름, 학위과정, 날짜, 출근, 퇴근

    pageOut += pageSuffix;
    res.send(pageOut);
});

app.get('/day-off', (req, res) => {
    let stdId = req.query.stdid;
    let formActionName = '/day-off';

    pageOut = '';
    pageOut += pagePrefix;
    pageOut += pageFormPrefix;
    pageOut += formActionName;
    pageOut += pageFormSuffix;
    pageOut += `<h3>휴가 신청 내역</h3>`;   // 학번, 이름, 학위과정, 날짜, 구분(연차/반차)
    pageOut += `<table><th>학번</th><th>이름</th><th>학위과정</th><th>날짜</th><th>구분</th>`;

    let queryDayoff = `
    SELECT stdId, name, course, doDate, doType
    FROM Members AS mem
        INNER JOIN DaysOff AS doff
        ON mem.stdId = doff.sid
    ORDER BY doDate ASC`;

    let queryDayoffFull = `
    SELECT stdId, name, course, doDate, doType
    FROM Members AS mem
        LEFT OUTER JOIN DaysOff AS doff
        ON mem.stdId = doff.sid
    WHERE doDate IS NOT NULL AND doDate <= NOW()
    UNION
    SELECT stdId, name, course, attDate,  
        CASE
        WHEN arrivalTime >= '14:31:00' OR leaveTime < '14:30:00' THEN 2
        WHEN arrivalTime >= '11:31:00' OR (leaveTime >= '14:30:00' AND leaveTime < '18:00:00') THEN 1
        ELSE 100
        END AS doType
    FROM Members AS mem
        LEFT OUTER JOIN Attendance AS att
        ON mem.stdId = att.sid
    WHERE attDate IS NOT NULL AND (arrivalTime >= '11:31:00' OR leaveTime < '18:00:00')
    ORDER BY doDate, stdId ASC`;

    connection.query(queryDayoff, (error, rows, fields) => {
        console.log(queryDayoff);
        if (error) throw error;
        rows.forEach((row) => {
            let course = courseTab[row.course];
            let doType = doTypeTab[row.doType];
            pageOut += `<tr>`;
            pageOut += `<td>${row.stdId}</td><td>${row.name}</td><td>${course}</td><td>${row.doDate}</td><td>${doType}</td>`;
            pageOut += `</tr>`;
        });
        pageOut += '</table><br>';
        // 현재까지 기준으로 출력 (오늘 기준으로는 미사용)
        pageOut += '<h3>전체 휴가 사용내역</h3>';   // 학번, 이름, 학위과정, 날짜, 구분
        pageOut += `<table><th>학번</th><th>이름</th><th>학위과정</th><th>날짜</th><th>구분</th>`;
        
        connection.query(queryDayoffFull, (error, rows, fields) => {
            console.log(queryDayoffFull);
            if (error) throw error;
            rows.forEach((row) => {
                let course = courseTab[row.course];
                let doType = doTypeTab[row.doType];
                pageOut += `<tr>`;
                pageOut += `<td>${row.stdId}</td><td>${row.name}</td><td>${course}</td><td>${row.doDate}</td><td>${doType}</td>`;
                pageOut += `</tr>`;
            });
            pageOut += `</table>`;
            pageOut += pageSuffix;
            return res.send(pageOut);
        });
    });
});

app.get('/std-info', (req, res) => {
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

app.get('/delete-std-info', (req, res) => {
    let pageOut = '';
    pageOut += pagePrefix;
    pageOut += `<h3>목록에서 삭제할 학생의 학번을 입력하세요</h3>`;
    pageOut += `<div><form action="/delete-std-info" accept-charset="utf-8" method="post">
    <fieldset>
        <ul class="insert-form">
            <li>
                <label for="stdid">학번</label>
                <input type="text" pattern="[0-9]{9}" name="stdid" id="stdid">
            </li>
            <li>
                <input type="submit" value="제출">
            </li>
        </ul>
    </fieldset>
    </div>`;
    pageOut += pageSuffix;
    res.send(pageOut);
});

app.post('/delete-std-info', (req, res) => {
    let msgSuffix = `window.location.replace('/delete-std-info');</script>`;
    let querySelect = `SELECT * FROM Members WHERE stdId=${req.body.stdid}`;
    let queryDelete = `DELETE FROM Members WHERE stdId=${req.body.stdid}`;

    console.log(req.body);

    // 사용자가 존재하는지 검색
    connection.query(querySelect, (error, rows, fields) => {
        console.log(querySelect);
        if (error) throw error;
        console.log(rows);
        if (rows.length == 0) {
            let msg = `<script>alert('사용자를 찾을 수 없습니다.');`;
            msg += msgSuffix;
            return res.send(msg);
        }

        connection.query(queryDelete, (error, rows, fields) => {
            console.log(queryDelete);
            if (error) throw error;

            let msg = `<script>alert('정상적으로 삭제되었습니다.');`;
            msg  += msgSuffix;
            return res.send(msg);
        });
    });
});

// app.get('/query', (req, res) => {
//     connection.query('SELECT * FROM Members', (error, rows, fields) => {
//         if (error) throw error;
//         //console.log('Members info is', rows);
//         pageOut = '';
//         pageOut += pagePrefix;

//         rows.forEach((row) => {
//             //console.log(`${row.name}'s ID is ${row.stdId}`);
//             pageOut += `${row.name}'s ID is ${row.stdId}<br>`;
//         });

//         pageOut += pageSuffix;
        
//         res.send(pageOut);
//     });
// });

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