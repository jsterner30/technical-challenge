const oracle = require("oracledb")
const AWS = require("aws-sdk")
const classes = require('./classes.js')


//Oracle DB Parameters
const params = {
    connectString: 'ora7gdev.byu.edu:1521/cescpy1.byu.edu'
}
oracle.outFormat = oracle.OBJECT
oracle.autoCommit = true

//AWS Parameters
let parameters = {
    Names: ['/js-technical-application/dev/USERNAME', '/js-technical-application/dev/PASSWORD'],
    WithDecryption: true
}

//AWS Configuration
AWS.config.update({ region: 'us-west-2'})
const ssm = new AWS.SSM()

/**
 * Set oracle creds so user can access DB
 * @param username AWS username
 * @param password AWS password
 * @returns void
 */
const setOracleCredentials = async (username, password) => {
    params.user = username
    params.password = password
}

/**
 * Check if user is connected to AWS
 * @returns void
 */
const getOracleCredentials = async function () {
    console.log('Testing AWS CLI connection -- please wait')
    try {

        const firstParams = await ssm.getParameters(parameters).promise()
        await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
    } catch (err) {
        console.log('It appears you are not connected to AWS CLI. PLease connect and try again')
        process.exit()
    }
}

/**
 * Checks if user is connected to VPN
 * @returns void
 */
testOracleConnectivityAws = async function(){
    try {
        console.log('Checking that your VPN is on -- please wait')
        const conn = await oracle.getConnection(params)
        await conn.execute('SELECT * FROM DUAL')
        await conn.close()
    } catch(e) {
        if (e.errorNum  = 12170){
            console.error("It appears you are not connected to your VPN")
            console.error("Please connect to your VPN and try again")
            process.exit()
        }
        else {
            console.log(e)
            throw e
        }
    }
}

/**
 * Deletes copy of table
 * @returns void
 */
async function truncateTable() {
    try {
        const firstParams = await ssm.getParameters(parameters).promise()
        await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
        const conn = await oracle.getConnection(params)
        await conn.execute('TRUNCATE TABLE OIT#JTS234.DOWN_COPY')
        await conn.close()
    }catch (err) {
        console.log('It appears you are not connected to AWS CLI. PLease connect and try again')
        process.exit()
    }
}

/**
 * Uses a table copy to check if a primary key already exists in real table. Updates duplicated and adds new keys to table
 * @param studentSchedule Student scheduke
 * @param byuID User BYU ID
 * @returns void
 */
async function writeDatabase(studentSchedule, byuID) {
    await truncateTable()
    for (let i = 0; i < studentSchedule.length; i++) {
        let idTime
        let days = ''
        let fullName = studentSchedule[i].studName
        let startTime = studentSchedule[i].startTime
        let endTime = studentSchedule[i].endTime
        let building = studentSchedule[i].building
        let room = studentSchedule[i].room
        let className = studentSchedule[i].name
        let isOnline = String(studentSchedule[i].online)
        let courseID = studentSchedule[i].id
        for (let j = 0; j < studentSchedule[i].days.length; j++) {
            days = dayNum(studentSchedule[i].days[j])
            idTime = byuID + '/' + days + "/" + startTime
            try {
                const firstParams = await ssm.getParameters(parameters).promise()
                await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
                const conn = await oracle.getConnection(params)
                let command = 'INSERT INTO OIT#JTS234.DOWN_COPY (ID_TIME, BYU_ID, FULL_NAME, START_TIME, END_TIME, BUILDING, ROOM, IS_VIRTUAL, CLASS_NAME, COURSE_ID, DAYS)' +
                                'VALUES (:idTime, :byuID, :fullName, :startTime, :endTime, :building, :room, :isOnline, :className, :courseID, :days)'
                await conn.execute(command, {idTime: idTime,byuID: byuID, fullName: fullName,startTime: startTime,endTime: endTime,building: building,room: room,isOnline: isOnline,className: className,courseID: courseID,days: days}, {outFormat: oracle.OBJECT, autoCommit: true})
                await conn.close()
                await mergeDBS()
            } catch (err) {
                console.log(err)
                throw err
                console.log('It appears you are not connected to AWS CLI. PLease connect and try again')
                process.exit()
            }
        }
    }
}

/**
 * Merges the table copy and real table
 * @returns void
 */
async function mergeDBS() {
    const firstParams = await ssm.getParameters(parameters).promise()
    await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
    const conn2 = await oracle.getConnection(params)
    let command =
        'MERGE INTO OIT#JTS234.DOWN_SCHEDULE D USING (SELECT * FROM OIT#JTS234.DOWN_COPY) S ON (D.ID_TIME = S.ID_TIME) WHEN MATCHED THEN UPDATE SET D.START_TIME = S.START_TIME, D.END_TIME = S.END_TIME, D.BUILDING = S.BUILDING, D.ROOM = S.ROOM, D.IS_VIRTUAL = S.IS_VIRTUAL, D.CLASS_NAME = S.CLASS_NAME, D.COURSE_ID = S.COURSE_ID, D.DAYS = S.DAYS WHEN NOT MATCHED THEN INSERT' +
        '(ID_TIME, BYU_ID, FULL_NAME, START_TIME, END_TIME, BUILDING, ROOM, IS_VIRTUAL, CLASS_NAME, COURSE_ID, DAYS)' +
        'VALUES (S.ID_TIME, S.BYU_ID, S.FULL_NAME, S.START_TIME, S.END_TIME, S.BUILDING, S.ROOM, S.IS_VIRTUAL, S.CLASS_NAME, S.COURSE_ID, S.DAYS)'
    await conn2.execute(command)
    await conn2.close()
}

/**
 * Allows user to remove downtime from table
 * @param answerArray Times user wants to remove
 * @param byuID User byu ID
 * @returns void
 */
async function removeDownTime(answerArray, byuID) {
    let wordArray = []
    let wordsArray = []
    let idTime
    let startTime
    let endTime
    let className
    let day
    for (let i = 0; i < answerArray.length; ++i){
        wordArray = answerArray[i].split('from')
        className = wordArray[0]
        wordsArray  = wordArray[1].split(' ')
        startTime = wordsArray[1]
        endTime = wordsArray[3]
        day = dayNum(wordsArray[5])
        idTime = byuID + '/' + day + '/' + startTime
        try {
            const firstParams = await ssm.getParameters(parameters).promise()
            await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
            const conn = await oracle.getConnection(params)
            let command = `DELETE FROM OIT#JTS234.DOWN_SCHEDULE WHERE ID_TIME = :idTime`
            await conn.execute(command, {idTime: idTime}, {outFormat: oracle.OBJECT, autoCommit: true})
            await conn.close()
        }catch (err){
            throw err
            console.log('It appears you are not connected to AWS CLI. PLease connect and try again')
            process.exit()
        }
    }

}

/**
 * Returns the database info in a way to be parsed and later edited
 * @param byuID
 * @returns {Promise<Week>} Week object with day schedule arrays
 */
async function editDatabase(byuID) {
    let week
    try {
        const firstParams = await ssm.getParameters(parameters).promise()
        await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
        const conn = await oracle.getConnection(params)
        const result = await conn.execute('SELECT * FROM OIT#JTS234.DOWN_SCHEDULE')
        week = await parseDatabase(result, byuID)
        return week
    } catch (err) {
        console.log('It appears you are not connected to AWS CLI. PLease connect and try again')
        process.exit()
    }
}

/**
 * Prints the weekly schedule
 * @param week Week object with day schedule arrays
 * @returns void
 */
async function printWeek(week) {
    if (week.Monday.length != 0) {
        console.table('Monday: ')
        console.table(week.Monday, ['name', 'building', 'startTime', 'endTime'])
    }
    if (week.Tuesday.length != 0) {
        console.table('Tuesday: ')
        console.table(week.Tuesday, ['name', 'building', 'startTime', 'endTime'])
    }
    if (week.Wednesday.length != 0) {
        console.table('Wednesday: ')
        console.table(week.Wednesday, ['name', 'building', 'startTime', 'endTime'])
    }
    if (week.Thursday.length != 0) {
        console.table('Thursday: ')
        console.table(week.Thursday, ['name', 'building', 'startTime', 'endTime'])
    }
    if (week.Friday.length != 0) {
        console.table('Friday: ')
        console.table(week.Friday, ['name', 'building', 'startTime', 'endTime'])
    }
    if (week.Saturday.length != 0) {
        console.table('Saturday: ')
        console.table(week.Saturday, ['name', 'building', 'startTime', 'endTime'])
    }
    if (week.Sunday.length != 0) {
        console.table('Sunday: ')
        console.table(week.Sunday, ['name', 'building', 'startTime', 'endTime'])
    }

}

/**
 * Parses database information
 * @param result Database info object
 * @param byuID User Byu ID
 * @returns {Promise<Week>} Week object with day schedule arrays
 */
async function parseDatabase(result, byuID) {
    let week = new classes.Week
    for (let i = 0; i < result.rows.length; ++i){
        let day = result.rows[i].DAYS
        let online = result.rows[i].IS_VIRTUAL
        let startTime = result.rows[i].START_TIME
        let endTime = result.rows[i].END_TIME
        let building = result.rows[i].BUILDING
        let room = result.rows[i].ROOM
        let className = result.rows[i].CLASS_NAME
        let databaseBYUID = result.rows[i].BYU_ID
        if (byuID == databaseBYUID) {
            switch (day) {
                case '0':
                    week.Monday.push(new classes.WeekCourse(className, building, room, startTime, endTime, online, convertTime(startTime) ))
                    break
                case '1':
                    week.Tuesday.push(new classes.WeekCourse(className, building, room, startTime, endTime, online, convertTime(startTime)))
                    break
                case '2':
                    week.Wednesday.push(new classes.WeekCourse(className, building, room, startTime, endTime, online, convertTime(startTime)))
                    break
                case '3':
                    week.Thursday.push(new classes.WeekCourse(className, building, room, startTime, endTime, online, convertTime(startTime)))
                    break
                case '4':
                    week.Friday.push(new classes.WeekCourse(className, building, room, startTime, endTime, online, convertTime(startTime)))
                    break
                case '5':
                    week.Saturday.push(new classes.WeekCourse(className, building, room, startTime, endTime, online, convertTime(startTime)))
                    break
                case '6':
                    week.Sunday.push(new classes.WeekCourse(className, building, room, startTime, endTime, online, convertTime(startTime)))
                    break
                case -1:
                    break
            }
        }
    }
    return week
}

/**
 * Changes day word or letter to a number
 * @param day Day number
 * @returns {number} Day number
 */
function dayNum(day) {
    switch (day) {
        case -1:
            return -1
        case 'M': case 'Monday':
            return 0
        case "T": case 'Tuesday':
            return 1
        case "W" : case  'Wednesday':
            return 2
        case 'Th' : case  'Thursday':
            return 3
        case "F" : case  'Friday':
            return 4
        case 'S' : case  'Saturday':
            return 5
        case "Su" : case  'Sunday':
            return 6
    }
}

/**
 * Converts time from hours:minutes to total seconds for comparison
 * @param time Time ("12:55")
 * @returns {number} Total seconds ("15000")
 */
function convertTime(time) {
    let str1 = time.split(":")
    let totalSecs = parseInt(str1[0] * 3600 + str1[1] * 60)
    return totalSecs
}

//Export Functions
module.exports = {testOracleConnectivityAws, getOracleCredentials, writeDatabase, dayNum, printWeek, editDatabase, removeDownTime, convertTime}