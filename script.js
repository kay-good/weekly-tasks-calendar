let users = []
let tasks = []
let grid = {}

async function fetchUsers() {
    const response = await fetch('https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users', {
        mode: 'cors',
        headers: {
            'Access-Control-Allow-Origin': '*'
          }
    })
    const usersJson = await response.json()
    console.log(usersJson)
    users = usersJson
    createUsers()
    grid = createEventGrid()
}
fetchUsers()

fetch('https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks', {
    mode: 'cors',
    headers: {
        'Access-Control-Allow-Origin': '*'
      }
})
    .then(res => res.json())
    .then(data => {
        console.log(data)
        tasks = data
        createEvents()

    })

const NUMBER_OF_DAYS = 7

const daysContainer = document.querySelector('.days')
const usersContainer = document.querySelector('.users')
const eventsContainer = document.querySelector('.events-container')
const backlogContainer = document.querySelector('.backlog')

let daysToSkip = 0
let weekObject = {}


function createDays() {
    const today = new Date()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDay = today.getDate()
    const todayWeekday = today.getDay()

    const lastSunday = new Date(todayYear, todayMonth, todayDay - todayWeekday)

    const currentWeek = new Array(NUMBER_OF_DAYS).fill(0).map(
        (_, index) => new Date(lastSunday.getFullYear(), lastSunday.getMonth(), lastSunday.getDate() + index + daysToSkip, 12)
    )

    daysContainer.replaceChildren()

    currentWeek.forEach(it => {
        const dateElement = document.createElement('li')
        dateElement.innerText = `${it.getDate()}.${it.getMonth() + 1}`
        dateElement.classList.add('day')
        daysContainer.appendChild(dateElement)
    })

    weekObject = currentWeek.reduce((acc, rec, index) => {
        const stringDate = rec.toISOString().split('T')[0]
        return {
            ...acc,
            [stringDate]: index + 1
        }
    }, {})
}

createDays()

function createUsers() {
    users.forEach(it => {
        const userElement = document.createElement('li')
        userElement.innerText = `${it.firstName} ${it.surname}`
        userElement.id = it.id
        userElement.classList.add('user')
        usersContainer.appendChild(userElement)
    })
}

function createEventGrid() {
    eventsContainer.style.gridTemplateRows = `repeat(${users.length}, 1fr)`
    eventsContainer.style.gridTemplateCols = `repeat(${NUMBER_OF_DAYS}, 1fr)`
    const grid = {}
    for (let row = 1; row <= users.length; row++) {
        for (let col = 1; col <= NUMBER_OF_DAYS; col++) {
            const eventElement = document.createElement('div')
            eventElement.classList.add('event-container')
            eventElement.style.gridRow = row;
            eventElement.style.gridColumn = col;
            eventElement.addEventListener('dragover', (e) => {
                e.preventDefault()
            })
            eventElement.addEventListener('drop', () => {
                const draggingElement = document.querySelector('.dragging')
                draggingElement.classList.add('task')
                draggingElement.classList.remove('backlog-task')
                eventElement.appendChild(draggingElement)

                const taskIndex = tasks.findIndex(it => it.id === draggingElement.id)
                tasks[taskIndex].executor = eventElement.style.gridRow
                tasks[taskIndex].planStartDate = Object.keys(weekObject)[eventElement.style.gridColumn - 1]
            })
            eventsContainer.append(eventElement)
            grid[`${row},${col}`] = eventElement
        }
    }
    return grid;
}

let backlogToSearch = []

function createEvents() {
    tasks.forEach(task => {
        const taskElement = document.createElement('div')
        taskElement.classList.add('hover-task')
        taskElement.id = task.id

        const taskTextElement = document.createElement('div')
        taskTextElement.innerText = `${task.subject}`
        taskTextElement.classList.add('task-text')

        const hoverElement = document.createElement('div')
        hoverElement.classList.add('hover-task-details')
        const hoverTextElement = document.createElement('div')
        const hoverDateElement = document.createElement('div')
        hoverTextElement.innerText = `Задача: ${task.subject}`
        hoverDateElement.innerText = `Дата начала: ${task.planStartDate}`

        hoverElement.appendChild(hoverTextElement)
        hoverElement.appendChild(hoverDateElement)
        taskElement.appendChild(taskTextElement)
        taskElement.appendChild(hoverElement)
        if (task.executor) {
            if (weekObject[task.planStartDate]) {
                taskElement.classList.add('task')
                const elementForThisTask = grid[`${task.executor},${weekObject[task.planStartDate]}`]
                elementForThisTask.appendChild(taskElement)
            }
        } else {
            taskElement.classList.add('backlog-task')
            taskElement.setAttribute("draggable", "true")
            taskElement.addEventListener('dragstart', () => {
                taskElement.classList.add('dragging')
            })
            taskElement.addEventListener('dragend', () => {
                taskElement.classList.remove('dragging')
            })
            backlogContainer.appendChild(taskElement)
            backlogToSearch = [...backlogToSearch, taskElement]
        }
    })
}


const backlogTasks = document.querySelectorAll('.backlog-task')
const userElemets = document.querySelectorAll('.user')
const searchInput = document.querySelector('input')
const weekBackButton = document.querySelector('.week-back')
const weekNextButton = document.querySelector('.week-next')

userElemets.forEach(element => {
    element.addEventListener('dragover', (e) => {
        e.preventDefault()
    })
    element.addEventListener('drop', () => {
        const draggingElement = document.querySelector('.dragging')
        const taskIndex = tasks.findIndex(it => it.id === draggingElement.id)
        tasks[taskIndex].executor = element.id
        draggingElement.classList.remove('backlog-task')
        draggingElement.classList.add('task')
        const elementForThisTask = grid[`${element.id},${weekObject[tasks[taskIndex].planStartDate]}`]
        elementForThisTask.appendChild(draggingElement)
    })
})

searchInput.addEventListener('input', e => {
    const value = e.target.value.toLowerCase()
    backlogToSearch.forEach(tastElement => {
        const isVisible = tastElement.innerText.toLowerCase().includes(value)
        tastElement.classList.toggle('hide', !isVisible)
    })
})

weekBackButton.addEventListener('click', () => {
    daysToSkip = daysToSkip - 7
    createDays()
    Object.keys(grid).forEach(cell => {
        grid[cell].replaceChildren()
    })
    backlogContainer.replaceChildren()
    createEvents()
})

weekNextButton.addEventListener('click', () => {
    daysToSkip = daysToSkip + 7
    createDays()
    Object.keys(grid).forEach(cell => {
        grid[cell].replaceChildren()
    })
    backlogContainer.replaceChildren()
    createEvents()
})