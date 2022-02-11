const functions = require("./lib.js")
const database = require("./database.js")

async function main() {
    await database.getOracleCredentials()
    await database.testOracleConnectivityAws()
    await functions.login()
    console.clear()

    let time = functions.getCurrTime()
    let needTime = 0;
    let day = functions.getCurrDay()
    let roomType = 'CLASSROOM'
    let needRepeat = true
    let buildingLocs = await functions.getBuildingPos()
    let buildingNames = await functions.getBuildingNames()
    buildingLocs = functions.scanArray(buildingNames, buildingLocs)
    let studentSchedule = await functions.getStudentSchedule()
    const delay = ms => new Promise(res => setTimeout(res, ms))
    let mainResponse = await functions.mainMenu()

    while (mainResponse != 5) {
        switch (mainResponse) {
            case 0:
                needRepeat = true;
                while (needRepeat) {
                    let buildingName = await functions.askUserBuilding(buildingLocs)
                    needTime = await functions.askUserNeedTime("How many minutes will you need the room?")
                    console.log("Retrieving data...")
                    console.log("This calculation may take a few moments...")
                    let buildingLocsRooms = await functions.getBuildingRoomSchedule(buildingName, buildingLocs)
                    buildingLocsRooms = await functions.getBusyTimes(buildingLocsRooms, buildingName)
                    let freeRoomArray = await functions.getFreeRooms(buildingLocsRooms, buildingName, day, time, roomType, needTime)
                    needRepeat = await functions.isEmpty(freeRoomArray, buildingName);
                }
                mainResponse = await functions.mainMenu();
                break

            case 1:
                studentSchedule = await functions.checkOnlineClasses(studentSchedule, buildingLocs)
                await delay(2000)
                mainResponse = await functions.mainMenu()
                break

            case 2:
                needRepeat = true
                while(needRepeat) {
                    await functions.printStudSched()
                    studentSchedule = await functions.addDownTime(studentSchedule, buildingLocs)
                    needRepeat = await functions.confirm('Would you like to add more downtime to your schedule?')
                }
                mainResponse = await functions.mainMenu()
                break

            case 3:
                console.clear();
                await functions.printStudSched()
                await delay(3000)
                mainResponse = await functions.mainMenu()
                break

            case 4:
                if (await functions.editOnlineClass()){
                    mainResponse = 1
                    break
                }
                console.clear()
                await delay(1000)
                mainResponse = await functions.mainMenu()
                break
            case 6:
                if (await functions.editDownTime()){
                    mainResponse = 2
                    break
                }
                console.clear()
                await delay(1000)
                mainResponse = await functions.mainMenu()
                break
        }
    }
}

main();




