/* DROP TABLE Members CASCADE CONSTRAINTS;
 DROP TABLE Attendance;*/

/*
course=phd, msd, und
dayOff=20,  15,  10
doType=1, 2 (반차, 연차)
*/

CREATE TABLE Members(
	stdId INT NOT NULL PRIMARY KEY,
	name  VARCHAR(15) NOT NULL,
	email VARCHAR(256),
	phone VARCHAR(15),
	course CHAR(3) NOT NULL);

CREATE TABLE Attendance(
	attDate DATE NOT NULL,
	sid INT NOT NULL,
	arrivalTime TIME,
	leaveTime   TIME,
	PRIMARY KEY(sid, attDate),
	FOREIGN KEY (sid)
		REFERENCES Members(stdId)
		ON DELETE CASCADE
);

CREATE TABLE DaysOff(
	doDate DATE NOT NULL,
	sid INT NOT NULL,
	doType INT NOT NULL,
	PRIMARY KEY(sid, doDate),
	FOREIGN KEY (sid)
		REFERENCES Members(stdId)
		ON DELETE CASCADE
);
