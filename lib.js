const axios = require('axios')
const database = require("./database.js")
const classes = require("./classes.js")
const math = require("mathjs")
const datePicker = require('inquirer-datepicker-prompt')
const inquirer = require("inquirer")
inquirer.registerPrompt('datetime', datePicker)

/**
 * Api variables and information
 */
let byuID
let token
let regExp = /[a-zA-z]/g

const buildingOptions = {
    url: 'https://api.byu.edu:443/domains/mobile/location/v2/buildings',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

const buildingNameOptions = {
    url: 'https://api.byu.edu:443/domains/legacy/academic/classschedule/classroom/v1/20221',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

const roomOptions = {
    url: '',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

const studentInfoOptions = {
    url: `https://api.byu.edu:443/byuapi/students/v3/${byuID}/enrolled_classes?year_terms=20221`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

const personOptions = {
    url: `https://api.byu.edu:443/byuapi/persons/v3/${byuID}`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

/**
 * Logs user in by calling functions that get BYU ID/WSO2 and test API connections
 *@returns void
 */
async function login() {
    byuID = await getbyuID()
    token = await getWSO2()
    studentInfoOptions.url = `https://api.byu.edu:443/byuapi/students/v3/${byuID}/enrolled_classes?year_terms=20221`
    personOptions.url = `https://api.byu.edu:443/byuapi/persons/v3/${byuID}`

    studentInfoOptions.headers =  {
        'Authorization': `Bearer ${token}`
    }
    buildingNameOptions.headers = {
        'Authorization': `Bearer ${token}`
    }
    buildingOptions.headers = {
        'Authorization': `Bearer ${token}`
    }
    roomOptions.headers = {
        'Authorization': `Bearer ${token}`
    }
    personOptions.headers = {
        'Authorization': `Bearer ${token}`
    }
    await testAPIS()
    await welcome()
}


/**
 * Gets name from Persons API and welcomes the user
 * @returns void
 */
async function welcome(){
    let info = await axios(personOptions)
    let first_name = info.data.basic.preferred_first_name.value
    console.clear()
    console.log(`Hello ${first_name}`)
}

/**
 * Prints a welcome message
 * @returns void
 */
async function printProgramName(){
    console.log('Welcome to Downtime Scheduler')
}

/**
 * Prints the program description
 * @returns void
 */
async function printProgramDescription(){
    console.log('This program allows you to schedule downtime during your off hours on campus' +
        '\nIt searches building classrooms at your desired time and provides you with a list of available rooms' +
        '\nThe program also allows you to schedule study time for online classes' +
        '\nEnjoy!')
}

/**
 * Asks the user to input their BYU ID and defeats SQL injections
 * @returns {Promise<string>} The users BYU ID
 */
async function getbyuID() {
    const answer2 = await inquirer
        .prompt([{
            name: "byuID",
            type: "input",
            message: "Please input your BYU ID (ex: 123456789)",
        }])
    let answer = String(answer2.byuID)
    if (regExp.test(answer) || answer.includes('/') || answer.length != 9) {
        console.log("Invalid BYU ID")
        await getbyuID()
    }
    else {
        return answer
    }
}

/**
 * Asks the user to input their WSO2 Token and checks for correct sizing
 * @returns {Promise<string>} The users WSO2 Token
 */
async function getWSO2() {
    const answer2 = await inquirer
        .prompt([{
            name: "WSO2",
            type: "input",
            message: "Please input your WSO2 Token",
        }])
    let answer = String(answer2.WSO2)
    if (answer.length < 25 || answer.length > 35) {
        console.log("Invalid WSO2 Token")
        await getWSO2()
    }
    else {
        return answer
    }
}

/**
 * Tests the all four APIS and returns an error message if the user is not connected to any API
 * @returns void
 */
async function testAPIS() {
    console.log('You should be subscribed to the following APIs:\nStudents\nAcademicClassScheduleClassRoom\nMobileLocationService\nPersons\n')
    console.log('Testing API connections...')
    try {
        let j = await axios(buildingNameOptions)
    }catch (err) {
        console.log('It appears you are not subscribed to the AcademicClassScheduleClassRoom API, or your Authorization Token is incorrect')
        console.log('Please subscribe to the AcademicClassScheduleClassRoom API and try again')
        process.exit()
    }
    try {
        let p = await axios(buildingOptions)
    }catch (err) {
        console.log('It appears you are not subscribed to the MobileLocationService API, or your Authorization Token is incorrect')
        console.log('Please subscribe to the MobileLocationService API and try again')
        process.exit()
    }
    try {
        let t = await axios(studentInfoOptions)
    }catch (err) {
        console.log('It appears you are not subscribed to the Students API, or your Authorization Token is incorrect')
        console.log('Please subscribe to the Students API and try again')
        process.exit()
    }
    try{
        let y = await axios(personOptions)
    }catch (err) {
        console.log('It appears you are not subscribed to the Persons API, or your Authorization Token is incorrect')
        console.log('Please subscribe to the Persons API and try again')
        process.exit()
    }
    console.log('You are connected to all necessary APIs')
}

/**
 * Main menu function that asks the user what they want to do
 * @returns {Promise<number>} Returns a number that the switch uses in the main function to direct program flow
 */
async function mainMenu() {
    const answer = await inquirer
        .prompt([{
            name: "response",
            type: "list",
            message: "What would you like to do?",
            choices: ["Add downtime to my current class schedule", "View current schedule", "Find empty rooms near me right now", "Remove downtime from my schedule",
                "Add a place and time for an online class", 'Edit online class schedule', "Quit"]
        },
        ])
    switch (answer.response){
        case "Find empty rooms near me right now":
            return 0
            break
        case "Add a place and time for an online class":
            return 1
            break
        case "Add downtime to my current class schedule":
            return 2
            break
        case "View current schedule":
            return 3
            break
        case "Quit":
            return 5
            break
        case "Remove downtime from my schedule":
            return 6
            break
        case "Edit online class schedule":
            return 4
            break
    }
}

/**
 * Gets the users longitude and latitude based on their IP address
 * THIS FUNCTION IS NO LONGER IN USE
 * @returns {Promise<(number|number)[]>} Returns the users lat and lon
 */
const getLocation = async () => {
    try {
        const resp = await axios.get('https://api64.ipify.org?format=json')
        let ip = resp.data.ip
        let location =  await axios.get(`http://api.ipstack.com/${ip}?access_key=890edec894569e79839a20c72851da72`)
        let lon = location.data.longitude
        let lat = location.data.latitude
        return [lat, lon]
    } catch (err) {
        console.log(err)
    }
}

/**
 * Gets the name and info of every building on campus
 * @returns {Promise<*[]>} Returns an array of buildings
 */
async function getBuildingNames() {
    try {
        buildingNameOptions.url = 'https://api.byu.edu:443/domains/legacy/academic/classschedule/classroom/v1/20221'
        let buildingNames = []
        const info = await axios(buildingNameOptions)
        const name = info.data.ClassRoomService.response
        for (let i = 0; i < name.buildings.length; i++) {
            buildingNames.push(name.buildings[i].building_name)
        }
        return buildingNames
    }catch(err) {
        console.log(err)
    }
}

/**
 * Checks if there are rooms available in a building. If not, prints rooms available
 * @param freeRoomArray A list of free rooms in a building
 * @param buildingName the name of the user chosen building
 * @returns {Promise<boolean>} Returns true if there are no rooms available
 */
async function isEmpty(freeRoomArray, buildingName){
    if (freeRoomArray.length === 0){
        console.log(`It appears there are no available rooms in the ${buildingName} for the amount of time you need.`)
        let answer = await inquirer
            .prompt([{
                name: "confirmA",
                type: "confirm",
                message: "Would you like to search a different BYU building?"
            }])
        if (answer.confirmA) {
            return true
        }
        else {
            return false
        }
    }
    else {
        console.log(`The following classrooms are available in the ${buildingName}:`)
        console.table(freeRoomArray, ['Room_Number', 'Available_Until'])
        return false
    }
}

/**
 * Gets a rooms buildings from the ClassRoomClassSchedule API
 * @param buildingCode The code of the desired building
 * @returns {Promise<*[]>} Returns an array of Room objects
 */
async function getBuildingRooms(buildingCode) {
    try {
        buildingNameOptions.url = `https://api.byu.edu:443/domains/legacy/academic/classschedule/classroom/v1/20221/${buildingCode}`
        let roomObjects = []
        const response = await axios(buildingNameOptions)
        const rooms = response.data.ClassRoomService.response.roomList
        for (let i = 0; i < rooms.length-1; i++) {
            roomOptions.url = `https://api.byu.edu:443/domains/legacy/academic/classschedule/classroom/v1/20221/${buildingCode}` + `/${rooms[i].room_number}/schedule`
            let response = await axios(roomOptions)
            let roomInfo = response.data.ClassRoomService.response
            roomObjects.push(new classes.Room(roomInfo.room, roomInfo.room_desc))
            roomObjects[i].scheduleArray = roomInfo.schedules
        }
        return roomObjects
    } catch(err) {
        console.log(err)
    }
}

/**
 * Gets building long and lats from the Mobile Location API
 * THIS FUNCTION IS NO LONGER IN USE
 * @returns {Promise<*[]>} Returns an array of building locations
 */
async function getBuildingPos() {
    try {
        buildingOptions.url = 'https://api.byu.edu:443/domains/mobile/location/v2/buildings'
        let buildingObjects = []
        const response = await axios(buildingOptions)
        for (let i = 0; i < response.data.length; i++) {
            buildingObjects.push(new classes.Building(response.data[i].name, response.data[i].acronym, response.data[i].latitude, response.data[i].longitude))
        }
        return buildingObjects
    } catch (err) {
        console.log(err)
    }
}

/**
 * Returns the users building based on use location
 * THIS FUNCTION IS NO LONGER IN USE
 * @param personArray Lon and lat of the person
 * @param buildingArray Building array with lons and lats
 * @returns void
 */
async function getBuilding(personArray, buildingArray) {
    try {
        let smallDistance = 100000
        let arrayPos
        for (let i = 0; i < buildingArray.length; i++){
            let distance = getDistBetween(personArray[0], personArray[1], buildingArray[i].lat, buildingArray[i].lon)
            if (distance < smallDistance){
                smallDistance = distance
                arrayPos = i
            }
        }
    } catch(err) {
        console.log(err)
    }
}

/**
 * Gets a students class schedule from the Students API
 * @returns {Promise<*[]>} Returns an array of classes for a student
 */
async function getStudentSchedule() {
    let dayArray = []
    let studentSchedule = []
    try {
        const info = await axios(studentInfoOptions)
        for (let i = 0; i < info.data.values.length; i++) {
            dayArray = []
            let className = info.data.values[i].course_title.value
            let id = info.data.values[i].curriculum_id.value
            let building = info.data.values[i].when_taught.object_array[0].building.value
            let room =info.data.values[i].when_taught.object_array[0].room.value
            let startTime = info.data.values[i].when_taught.object_array[0].start_time.value
            let endTime = info.data.values[i].when_taught.object_array[0].end_time.value
            let online = info.data.values[i].taught_online.value
            let days= info.data.values[i].when_taught.object_array[0].days.value
            let studName = info.data.values[i].byu_id.description
            if (days == "Daily"){
                days = "MTWThF"
            }
            if (days != null) {
                dayArray = daysParse(days)
            }
            else {
                dayArray = [-1]
            }
            studentSchedule.push(new classes.Course(className, id, studName, building, room, startTime, endTime, online, dayArray))
        }
    }catch(err) {
        console.log(err)
    }
    database.writeDatabase(studentSchedule, byuID)
    return studentSchedule
}

/**
 * Shortens the building array by cutting out all buildings that are not used for teaching
 * @param nameArray Array of building where classes are taught
 * @param buildingLocs Array of all campus buildings
 * @returns {*[]} Shortened array of buildings
 */
function scanArray(nameArray, buildingLocs){
    let buildingLocations = []
    for (let i = 0; i < buildingLocs.length; i++){
        for (let j = 0; j < nameArray.length; j++){
            if (nameArray[j] == buildingLocs[i].code){
                 buildingLocations.push(buildingLocs[i])
            }
        }
    }
    return buildingLocations
}

/**
 * Gets the distance between two lats/lons
 * THIS FUNCTION IS NO LONGER IN USE
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 * @returns {number}
 */
function getDistBetween(lat1, lon1, lat2, lon2){
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0
    }
    else {
        return math.sqrt(math.pow((lat1 + lat2), 2) + math.pow((lon1 + lon2), 2))
    }
}

/**
 * Asks the user what building they want to search
 * @param buildingArray Array of buildings
 * @returns {Promise<*>} The building name
 */
async function askUserBuilding(buildingArray) {
    const answer = await inquirer
        .prompt([{
            name: "name",
            type: "list",
            message: "Which BYU building would you like to search?",
            choices: buildingArray,
        },
        ])
    const answer2 = await inquirer
        .prompt([
            {
                name: "confirmAnswer",
                type: "confirm",
                message: `Are you sure you like to find empty classrooms in the ${answer.name}? \n If not, click \"n\"`,
            },
        ])
        if (answer2.confirmAnswer){
            return answer.name
        }
        else {
            await askUserBuilding(buildingArray);
        }
}

/**
 * Gets the room schedule of a building
 * @param buildingName Name of the building
 * @param buildingArray Array of buidlings
 * @returns {Promise<*>} Updated array of buildings
 */
async function getBuildingRoomSchedule(buildingName, buildingArray) {
    for (let i = 0; i < buildingArray.length; i++) {
        if (buildingArray[i].name == buildingName) {
            let roomObjectArray = await getBuildingRooms(buildingArray[i].code)
            buildingArray[i].roomArray = roomObjectArray
        }
    }
    return buildingArray
}

/**
 * Asks the user how long they need a room
 * @param question Message of the question
 * @returns {Promise<number>} Number of minutes they will need the room
 */
async function askUserNeedTime(question){
    let seconds = 60
    const answer = await inquirer
        .prompt([{
            name: "minutes",
            type: "number",
            message: question,
        },
        ])
    if (!answer.minutes && answer.minutes != 0){
        console.log("Please enter a number")
        await askUserNeedTime()
    }
    else {
        return seconds * answer.minutes
    }
}

/**
 * Gets the busy times of the rooms in a building
 * @param buildingArray Building Array
 * @param buildingName Building Name
 * @returns {Promise<*>} Updated building array
 */
async function getBusyTimes(buildingArray, buildingName){
    let busyTimeArray
    let tArray = []
    let wArray = []
    let thArray = []
    let fArray = []
    let sArray = []
    let suArray = []
    let mArray = []
    let dayArray;
    let time
    for (let i = 0; i < buildingArray.length; i++) {
        if (buildingArray[i].name == buildingName) {
            if (buildingArray[i].roomArray){
                for (let j = 0; j < buildingArray[i].roomArray.length; j++){
                    for (let k = 0; k < buildingArray[i].roomArray[j].scheduleArray.length; k++){
                        busyTimeArray = []
                        let days = buildingArray[i].roomArray[j].scheduleArray[k].days
                         if (days == "Daily"){
                             days = "MTWThF"
                         }
                        dayArray = daysParse(days)
                        time = buildingArray[i].roomArray[j].scheduleArray[k].class_time
                        for (let l = 0; l < dayArray.length; l++) {
                            switch (dayArray[l]) {
                                case 'M':
                                    mArray.push(timeParse(time))
                                    break
                                case "T":
                                    tArray.push(timeParse(time))
                                    break
                                case "W":
                                    wArray.push(timeParse(time))
                                    break
                                case 'Th':
                                    thArray.push(timeParse(time))
                                    break
                                case "F":
                                    fArray.push(timeParse(time))
                                    break
                                case 'S':
                                    sArray.push(timeParse(time))
                                    break
                                case "Su":
                                    suArray.push(timeParse(time))
                                    break
                            }
                        }
                    }
                    buildingArray[i].roomArray[j].weekScheduleArray.push(mArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(tArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(wArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(thArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(fArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(sArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(suArray)
                    mArray = []
                    tArray = []
                    wArray = []
                    thArray = []
                    fArray = []
                    sArray = []
                    suArray = []
                }
            }
        }
    }
    return buildingArray
}

/**
 * Gets the free rooms based on the busy times of rooms in a building and the users needs
 * @param buildingArray Array of buildings
 * @param buildingName Name of desired building
 * @param day Day the user wants to search
 * @param time Time the user wants to search
 * @param roomType Type of room the user wants to search (defualt "CLASSROOM")
 * @param needTime How long the user needs the room
 * @returns {Promise<*[]>} Returns an array of free rooms to be presented to the user
 */
async function getFreeRooms(buildingArray, buildingName, day, time, roomType, needTime) {
    let freeObj = []
    const dayNumber = database.dayNum(day)
    for (let i = 0; i < buildingArray.length; i++) {
        if (buildingArray[i].name == buildingName && buildingArray[i].roomArray) {
            for (let j = 0; j < buildingArray[i].roomArray.length; j++){
                if (buildingArray[i].roomArray[j].description == roomType){
                    if (buildingArray[i].roomArray[j].weekScheduleArray[dayNumber]) {
                        for (let k = 0; k < buildingArray[i].roomArray[j].weekScheduleArray[dayNumber].length; k++) {
                            let timeSecs = await database.convertTime(time)
                            let startTime = buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k][0]
                            let endTime = buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k][1]
                            let startTimeSecs = database.convertTime(startTime)
                            let endTimeSecs = database.convertTime(endTime)
                            if (timeSecs < startTimeSecs) {
                                if (buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k - 1]) {
                                    if (timeSecs > database.convertTime(buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k - 1][0]) && startTimeSecs - timeSecs > needTime) {
                                        freeObj.push(new classes.FreeRoom(buildingArray[i].roomArray[j].number, startTime))
                                    }
                                } else if (startTimeSecs - timeSecs > needTime) {
                                    freeObj.push(new classes.FreeRoom(buildingArray[i].roomArray[j].number, startTime))
                                }
                            }
                        }
                    }
                }
                }
            }
        }
    return freeObj
}

/**
 * Parses days to be a use able array
 * @param days String of days
 * @returns {*|T[]} Array of days
 */
function daysParse(days){
    let dayArray = days.split("")
    for (let i = 0; i < dayArray.length; i++){
        if (dayArray[i] == 'h'){
            dayArray[i-1] = "Th"
            dayArray[i] = ""

        }
    }
    dayArray = dayArray.filter(item => item !== "")
    return dayArray
}

/**
 * Parses the time to be a startTime and an endTime
 * @param time Input time ("1:00-3:00")
 * @returns {*|string[]} Time array with start time and end time
 */
function timeParse(time){
    let timeArray = time.split(" - ")
    for (let i = 0; i < timeArray.length; i++){
        let hour = timeArray[i]
        if (hour.charAt(hour.length-1) == "p"){
            let newHourArray = hour.split(":")
            let newHour = parseInt(newHourArray[0])
            if (newHour != 12) {
                newHour += 12
            }
            newHour.toString()
            timeArray[i] = newHour + ":" + newHourArray[1]
        }
    }
    for (let i = 0; i < timeArray.length; i++){
        timeArray[i] = timeArray[i].substring(0, timeArray[i].length-1)
    }
    return timeArray
}

/**
 * Adds the time a user needs to the start time to get an end time
 * @param startTime Start time
 * @param hourAdd Amount of hours to be added
 * @param minAdd Amount of minutes to be added
 * @returns {Promise<string>} Returns the endtime
 */
async function timeAdd(startTime, hourAdd, minAdd)  {
    let timeArray = startTime.split(":")
    let newHour = parseInt(timeArray[0])
    newHour += hourAdd
    let newMin = parseInt(timeArray[1])
    newMin += minAdd * 60
    let endTime = newHour.toString() + ':' + newMin.toString()
    return endTime
}

/**
 * Gets the current day of the week
 * @returns {string} Returns day of the week
 */
function getCurrDay() {
    const weekday = ["S","M","T","W","Th","F","S"]
    let today = new Date()
    let day = weekday[today.getDay()]
    let currentDay = day
    return currentDay
}

/**
 * Gets the current time
 * @returns {string} Returns the current time
 */
function getCurrTime() {
    let today = new Date()
    let hours = (today.getHours() + 11) % 12 + 1
    hours = hours > 12 ? hours + 12 : hours
    let minutes = today.getMinutes()
    let currentTime = hours + ":" + minutes
    return currentTime
}

/**
 * Prints the users current schedule by calling datbase functions
 * @returns void
 */
async function printStudSched() {
    console.log("Here is your current schedule:")
    let weekSched = await database.editDatabase(byuID)
    weekSched.sorter()
    await database.printWeek(weekSched)
}

/**
 * Checks to see if a time is available in a students schedule
 * @param studSched Student schedule
 * @param time Start time
 * @param days Desired days
 * @param message Return message based on what function calls this function
 * @returns {Promise<boolean>} True if student is busy at proposed time
 */
async function checkTime(studSched, time, days, message) {
    let newTime = database.convertTime(time)
     for (let i = 0; i < studSched.length; i++) {
         if (studSched[i].online != true) {
             for (let j = 0; j < studSched[i].days.length; j++) {
                 for (let k = 0; k < days.length; k++) {
                     if (studSched[i].days[j] == days[k] && database.convertTime(studSched[i].startTime) <= newTime && newTime <= database.convertTime(studSched[i].endTime)) {
                         console.log(`It looks like you are busy on ${letterToDay(days[k])} at${time} with ${studSched[i].name}`)
                         console.log(message)
                         return true
                     }
                     else {
                         continue
                     }
                 }
             }
         }
     }
     return false
 }

/**
 * Checks to see if a student has an online class and allows the student to edit the classes schedule
 * @param studSched Student schedule
 * @param buildingArray Array of buildings
 * @returns {Promise<*>} The students updated schedule
 */
async function checkOnlineClasses(studSched, buildingArray) {
    let daysArray
    let days
    let userTime
    let needTime
    let roomType = "CLASSROOM"
    try {
        for (let i = 0; i < studSched.length; i++) {
            if (studSched[i].online == true) {
                console.log(`${studSched[i].name} is an online class`)
                let answerDays = await inquirer
                    .prompt([{
                        name: "day",
                        type: "checkbox",
                        message: "On which days would you like to schedule this class",
                        choices: ['M', 'T', 'W', 'Th', 'F', 'S', 'Su']
                    }])
                daysArray = answerDays.day
                days = answerDays.day.join('')
                let answer3 = await inquirer
                    .prompt([{
                        name: "times",
                        type: "datetime",
                        message: "Select the time you want to start studying",
                        format: ['H', ':', 'MM'],
                        initial: new Date('1999-12-31 6:00'),
                        time: {
                            min: '6:00',
                            max: '23:00'
                        },
                        minutes: {
                            interval: 5
                        },
                        choices: []
                    }])
                userTime = answer3.times.toString()
                userTime = userTime.substr(15, 6)
                needTime = await askUserNeedTime(`How many minutes do you plan on studying ${studSched[i].name} on your chosen days?`)
                needTime /= 60
                let fullTime = needTime / 60
                let minTime = fullTime - Math.floor(fullTime) * 60
                let hTime = Math.floor(fullTime)

                let endTime = await timeAdd(userTime, hTime, minTime)
                if (await checkTime(studSched, userTime, daysArray, 'Please choose a time and day when you are free to schedule your online class')) {
                    await checkOnlineClasses(studSched, buildingArray)
                } else {
                    let buildingCode
                    let answer4 = await inquirer
                        .prompt([{
                            name: "building",
                            type: "list",
                            choices: buildingArray,
                            message: `In what BYU building will you take ${studSched[i].name}?`
                        }])
                    let daysAvailable = await checkRooms(answer4.building, buildingArray, studSched, days, userTime, roomType, needTime, daysArray, needTime, true)
                    let answer5 = await inquirer
                        .prompt([{
                            name: "room",
                            type: "list",
                            choices: daysAvailable,
                            message: `In what room would you like to take ${studSched[i].name}?`
                        }])
                    for (let t = 0; t < buildingArray.length; t++) {
                        if (answer4.building == buildingArray[t].name) {
                            buildingCode = buildingArray[t].code
                        }
                    }
                    userTime = userTime.substr(1, 5)
                    studSched[i].building = buildingCode
                    studSched[i].room = answer5.room
                    studSched[i].startTime = userTime
                    studSched[i].endTime = endTime
                    studSched[i].days = daysArray
                    await database.writeDatabase(studSched, byuID)
                    console.clear()
                    console.log("Your schedule has been updated")
                    return studSched
                }
            } else {
                continue
            }
        }
        console.log('It appears you have no online classes')
        return studSched
    }catch(error) {
        return studSched
    }
}

/**
 * Allows the user to edit downtime in the database
 * @returns {Promise<boolean>} Returns false if the student has no downtime
 */
async function editDownTime() {
    let weekArray = []
    let classesArray = []
    let studSched = await database.editDatabase(byuID)
    for (let k = 0; k < 7; ++k) {
        weekArray.push(studSched.at(k))
    }
        for (let i = 0; i < weekArray.length; ++i){
            for (let j = 0; j < weekArray[i].length; ++j) {
                if (weekArray[i][j].name == "Downtime") {
                    classesArray.push(weekArray[i][j].name + " from " + weekArray[i][j].startTime + " to " + weekArray[i][j].endTime + " on " + studSched.day(i))
                }
            }
        }

    if (classesArray.length == 0){
        console.log('It appears that you have no scheduled downtime')
        let response = await confirm('Would you like to schedule downtime')
        return response
    }
    else {
        console.log("Here is your current schedule:")
        await database.printWeek(studSched)
        let answer = await inquirer
            .prompt([{
                name: "downtime",
                type: "checkbox",
                message: "What would you like to remove from your schedule?",
                choices: classesArray
            }])
        await database.removeDownTime(answer.downtime, byuID)
    }
    console.clear()
    console.log("Your schedule has been updated")
}

/**
 * Allows the user to edit online class schedule if they have any
 * @returns {Promise<boolean>} Returns false if the student has no online classes scheduled
 */
async function editOnlineClass() {
    let weekArray = []
    let classesArray = []
    let studSched = await database.editDatabase(byuID)
    for (let k = 0; k < 7; ++k) {
        weekArray.push(studSched.at(k))
    }
    for (let i = 0; i < weekArray.length; ++i){
        for (let j = 0; j < weekArray[i].length; ++j) {
            if (weekArray[i][j].online == "true") {
                classesArray.push(weekArray[i][j].name + " from " + weekArray[i][j].startTime + " to " + weekArray[i][j].endTime + " on " + studSched.day(i))
            }
        }
    }

    if (classesArray.length == 0){
        console.log('It appears that you have no online classes with scheduled times or places')
        let response = await confirm('Would you like to add a time and place to your online class?')
        return response
    }
    else {
        console.log("Here is your current schedule:")
        await database.printWeek(studSched)
        let answer = await inquirer
            .prompt([{
                name: "onlineClasses",
                type: "checkbox",
                message: "What would you like to remove from your schedule?",
                choices: classesArray
            }])
        await database.removeDownTime(answer.onlineClasses, byuID)
    }
    console.clear()
    console.log("Your schedule has been updated")
}

/**
 * Allows the user to add downtime to schedule/database
 * @param studSched Student schedule
 * @param buildingArray Array of buildings
 * @returns {Promise<*>} Updated student schedule
 */
async function addDownTime(studSched, buildingArray) {
    let daysArray = []
    let days
    let userTime
    let needTime
    let roomType = "CLASSROOM"
    let className = 'Downtime'
    let id = '00000'
    let studName = studSched[0].studName
    let answerDays = await inquirer
        .prompt([{
            name: "day",
            type: "checkbox",
            message: "On which days would you like to schedule downtime?",
            choices: ['M', 'T', 'W', 'Th', 'F', 'S', 'Su']
        }])
    daysArray = answerDays.day
    days = answerDays.day.join('')
    let answer3 = await inquirer
        .prompt([{
            name: "times",
            type: "datetime",
            message: "Select the time you want to start studying",
            format: ['H', ':', 'MM'],
            initial: new Date('1999-12-31 6:00'),
            time: {
                min: '6:00',
                max: '23:00'
            },
            minutes: {
                interval: 5
            }
        }])
    userTime = answer3.times.toString()
    userTime = userTime.substr(15, 6)
    needTime = await askUserNeedTime(`How many minutes will your downtime be on your chosen days?`)
    needTime /= 60
    let fullTime = needTime / 60
    let minTime = fullTime - Math.floor(fullTime) * 60
    let hTime = Math.floor(fullTime)
    let endTime = await timeAdd(userTime, hTime, minTime)
    if (await checkTime(studSched, userTime, daysArray, 'Please choose a time and day when you are free to schedule your downtime')) {
        await addDownTime(studSched, buildingArray)
    }
    else {
        let buildingCode
        let answer4 = await inquirer
            .prompt([{
                name: "building",
                type: "list",
                choices: buildingArray,
                message: `In what BYU building will you spend your downtime?`
            }])
        let daysAvailable = await checkRooms(answer4.building, buildingArray, studSched, days, userTime, roomType, needTime, false)
        if (!daysAvailable) {
            return
        } else {
            let answer5 = await inquirer
                .prompt([{
                    name: "room",
                    type: "list",
                    message: `In what room would you like to take spend your downtime?`,
                    choices: daysAvailable,
                }])
            for (let t = 0; t < buildingArray.length; t++) {
                if (answer4.building == buildingArray[t].name) {
                    buildingCode = buildingArray[t].code
                }
            }
            let online = false
            userTime = userTime.substr(1, 5)
            studSched.push(new classes.Course(className, id, studName, buildingCode, answer5.room, userTime, endTime, online, daysArray))
            await database.writeDatabase(studSched, byuID)
            console.clear()
            console.log("Your schedule has been updated")
            return studSched
        }
    }
}

/**
 * Asks a user a yes or no question
 * @param question The message of the question
 * @returns {Promise<boolean>} True or false based on user answer
 */
async function confirm(question) {
    let answer = await inquirer
        .prompt([{
            name: "confirmation",
            type: "confirm",
            message: question
        }])
    if (answer.confirmation) {
        return true
    }
    else {
        return false
    }
}

/**
 * Checks availability of rooms for online/donwtime scheduler functions
 * @param building Building name
 * @param buildingArray Array of building
 * @param studSched Student schedule
 * @param days Days desired
 * @param userTime Time to check
 * @param roomType Room type
 * @param needTime Time the user needs
 * @param needOnlineFunc True or false based on which function calls this function
 * @returns {Promise<*[]>} Returns updated student schedule
 */
async function checkRooms(building, buildingArray, studSched, days, userTime, roomType, needTime, needOnlineFunc) {
    let daysAvailable = []
    let freeRoomArray = []
    let fullArray = []
    console.log('Calculating room availability...')
    console.log('This may take several moments...')
    for (let t = 0; t < days.length; t++) {
        let buildingLocsRooms = await getBuildingRoomSchedule(building, buildingArray)
        buildingLocsRooms = await getBusyTimes(buildingLocsRooms, building)
        freeRoomArray = await getFreeRooms(buildingLocsRooms, building, days[t], userTime, roomType, needTime)
        fullArray = fullArray.concat(freeRoomArray)
    }
    for (let i = 0; i < freeRoomArray.length; i++) {
        if (days.length == getOccurrence(fullArray, freeRoomArray[i])) {
            daysAvailable.push(freeRoomArray[i])
        }
    }
    if (daysAvailable.length == 0) {
        let answer = await inquirer
            .prompt ([{
            name: "names",
            type: "confirm",
            message: `It appears there are no rooms available in the ${building}. Would you like to schedule a different building?`
        }])
        if (answer.names) {
            if (needOnlineFunc) {
                await checkOnlineClasses(studSched, buildingArray)
            }
            else {
                await addDownTime(studSched, buildingArray)
            }
        }
        else {
            return
        }
    }
    else {
        console.log(`The following rooms are available in the ${building} at${userTime} for at least ${needTime} minutes on the days you have chosen`)
        console.table(daysAvailable, ['Room_Number', 'Available_Until'])
        return daysAvailable
    }
}

/**
 * Returns the number of times a room is in an array
 * @param array Room array
 * @param value Room number
 * @returns {number} The number of times the room appears
 */
function getOccurrence(array, value) {
    let count = 0
    if (array.length == 0){
        return count
    }
    else {
        for (let j = 0; j < array.length; j++) {
            if (array[j].Room_Number == value.Room_Number && array[j].Available_Until == value.Available_Until) {
                count++
            }
        }
        return count
    }
}

/**
 * Converts a letter day to a full word
 * @param letter Letter day
 * @returns {string} Full day word
 */
function letterToDay(letter) {
    switch (letter) {
        case 'M':
            return 'Monday'
        case 'T':
            return 'Tuesday'
        case 'W':
            return 'Wednesday'
        case 'Th':
            return 'Thursday'
        case 'F':
            return 'Friday'
        case 'S':
            return 'Saturday'
        case 'Su':
            return 'Sunday'
    }

}

//Export Functions
module.exports = {getLocation, getBuildingPos, getBuildingNames, scanArray, askUserBuilding,
    getBuildingRoomSchedule, getFreeRooms, getCurrDay, getCurrTime, getBusyTimes, mainMenu, askUserNeedTime,
    getStudentSchedule, login, printStudSched, checkOnlineClasses, isEmpty, addDownTime, confirm, editDownTime,
    editOnlineClass, printProgramName, printProgramDescription}

