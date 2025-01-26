let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
let width = 1600
let height = 400
let checkMultipleFetch = 0
svg.setAttribute('width', width);
svg.setAttribute('height', height);
let margin = { top: 20, right: 20, bottom: 100, left: 50 }
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
document.addEventListener('DOMContentLoaded', () => {
    let token = localStorage.getItem('authToken')
    if (token && token !== "undefined") {
        console.log(document.getElementById('xpProject'))
        profile(token)
    }else{
        document.getElementById('login-container').style.display = 'block'
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            checkMultipleFetch = 1
            e.preventDefault()
            document.querySelector("button[type='submit']").disabled = true
            let username = document.getElementById('username').value
            let password = document.getElementById('password').value
            console.log(username, password)
            token = await getToken(username, password)
            if (token === "undefined") return
            console.log(token);
            localStorage.setItem('authToken', token);
            console.log('Token saved!');
            profile(token)
        })
    }
})

document.getElementById('logout').addEventListener('click', ()=>{
    svg.innerHTML = '';
    document.getElementById('xpProgression').innerHTML = '';
    document.getElementById('xpProject').innerHTML = '';
    let circleDetail = document.createElement('div');
    circleDetail.id = 'circleDetail';
    xpProgression.appendChild(circleDetail);
    let rectDetail = document.createElement('div');
    rectDetail.id = 'rectDetail';
    xpProject.appendChild(rectDetail);
    checkMultipleFetch = 0;
    document.querySelector("button[type='submit']").disabled = false;
    localStorage.removeItem('authToken');
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('profile-container').style.display = 'none';
    document.getElementById('profileContainer').innerHTML = '';
});
async function getToken(username, password) {
    console.log(`${username}:${password}`, btoa(`${username}:${password}`))

    let auth = btoa(`${username}:${password}`)
    let r = await fetch(`https://learn.zone01oujda.ma/api/auth/signin`, {
        method: "POST",
        headers: {
            'Authorization': `Basic ${auth}`
        },
    })
    if (!r.ok) {
        console.error("invalid credential")
        let err = document.createElement('p')
        err.innerHTML = "invalid credential"
        document.getElementById('login-container').appendChild(err)
        return
    }
    let token = await r.json()
    console.log("arrObj: ", token)
    return token
}
async function profile(token) {
    let userID = `{user{id}}`
    let fetchID = await fetchData(userID, token)
    userID = fetchID.data.user[0].id    
    let data = `
    {
  user {
    firstName
    lastName
    login
    auditRatio
    campus
  }

  transaction_aggregate(where: {userId: {_eq: ${userID}}, type: {_eq: "xp"}, eventId: {_eq: 41}}) {
    aggregate {
      sum {
        amount
      }
    }
  }

  transaction(where: {type: {_eq: "xp"}, eventId: {_eq: 41}}) {
    path
    amount
    progress {
      updatedAt
    }
  }
}
`
    let dataFetched = await fetchData(data, token)
    letsWorkWithProfile(dataFetched)
    letsWorkWithProgressXp(dataFetched)
    letsWorkWithProjectXp(dataFetched)
    console.log(dataFetched.data.transaction)
}

async function fetchData(query, token) {
    let endPoint = `https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql`
    let dataUser = await fetch(endPoint, {
        method: "POST",
        headers: {
            'Content-Type': `application/json`,
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
    })
    console.log(dataUser.ok)

    if (!dataUser.ok) return
    let response = await dataUser.json()
    console.log("r: ", response)
    return response
}

function letsWorkWithProfile(dataFetched) {
    document.getElementById('login-container').style.display = 'none'
    document.getElementById('profile-container').style.display = 'block'
    let profileContainer = document.getElementById('profileContainer')
    profileContainer.style.padding = '20px'
    profileContainer.style.border = '1px solid #ccc'
    profileContainer.style.background = 'white'
    profileContainer.style.borderRadius = '8px'
    profileContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
    profileContainer.style.margin = '20px'
    let firstname = document.createElement('h1')
    firstname.innerHTML = `First Name: ${dataFetched.data.user[0].firstName}`
    let lastname = document.createElement('h2')
    lastname.innerHTML = `Last Name: ${dataFetched.data.user[0].lastName}`
    let auditRatio = document.createElement('p')
    auditRatio.innerHTML = `Audit Ratio: ${dataFetched.data.user[0].auditRatio.toFixed(2)}`
    let campus = document.createElement('p')
    campus.innerHTML = `Campus: ${dataFetched.data.user[0].campus}`
    let xp = document.createElement('h1')
    //console.log(dataFetched.data.transaction_aggregate.aggregate.sum.amount)
    xp.innerHTML = `XP: ${dataFetched.data.transaction_aggregate.aggregate.sum.amount}`
    profileContainer.appendChild(firstname)
    profileContainer.appendChild(lastname)
    profileContainer.appendChild(xp)
    profileContainer.appendChild(auditRatio)
    profileContainer.appendChild(campus)
}
function letsWorkWithProgressXp(dataFetched) {
    let arrObj = [];
    let oldValue = 0
    dataFetched.data.transaction.forEach(element => {
        let currentObj = {
            xp: oldValue + element.amount,
            date: element.progress.updatedAt.split('T')[0]
        };
        oldValue += element.amount
        arrObj.push(currentObj)
    });
    console.log(arrObj);
    svg.innerHTML += `
    <line x1=${margin.left} y1=${margin.top} x2=${margin.left} y2=${height - margin.bottom} style="stroke:black;stroke-width:2" />
    <line x1=${margin.left} y1=${height - margin.bottom} x2=${width - margin.right} y2=${height - margin.bottom} style="stroke:black;stroke-width:2" />
    `
    let dataXp = arrObj.map(d => d.xp)
    let maxXP = Math.max(...dataXp)
    let minXP = Math.min(...dataXp)
    let cordinateX = dataXp.map((_, i) => (i / (dataXp.length - 1)) * chartWidth)
    let cordinateY = dataXp.map((d) => chartHeight - ((d - minXP) / (maxXP - minXP)) * chartHeight)
    let cordinate = ''
    for (let i = 0; i < dataXp.length; i++) cordinate += `${cordinateX[i] + margin.left},${cordinateY[i] + margin.top} `
    console.log(cordinate);
    svg.innerHTML += `
        <polyline fill="none" stroke="blue" stroke-width="2" points="${cordinate}" />
    `
    for (let i = 0; i < dataXp.length; i++) {
        let cx = cordinateX[i] + margin.left
        let cy = cordinateY[i] + margin.top
        svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="4" fill="red" data-xp="${dataXp[i]}" data-date="${arrObj[i].date}" />
      `
    }
    let circleDetail = document.getElementById('circleDetail')
    svg.addEventListener('mousemove', (e) => {
        let target = e.target
        if (target.tagName === 'circle') {
            circleDetail.style.display = "block";
            circleDetail.style.left = `${e.pageX + 10}px`;
            circleDetail.style.top = `${e.pageY - 10}px`;
            circleDetail.textContent = `XP: ${target.dataset.xp}, Date: ${target.dataset.date}`;
        } else {
            circleDetail.style.display = "none";
        }
    })
    let xpProgression = document.getElementById('xpProgression')
    xpProgression.appendChild(svg)
}

function letsWorkWithProjectXp(dataFetched) {
    let arrObj = dataFetched.data.transaction.map(element => {
        const pathParts = element.path.split('/');
        if (pathParts[3] !== 'checkpoint') {
            return {
                path: pathParts[3],
                amount: element.amount / 1000
            };
        }
        return null
    }).filter(item => item !== null)
    

    const maxAmount = Math.max(...arrObj.map(d => d.amount));
    console.log(maxAmount, chartHeight);

    const cordinateX = (i) => ((i / (arrObj.length)) * chartWidth) + margin.left;
    const yScale = d => chartHeight - (d / maxAmount) * chartHeight + margin.top;
    const barWidth = chartWidth / arrObj.length - 10;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    // Draw axes
    svg.innerHTML = `
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" style="stroke:black;stroke-width:2" />
        <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" style="stroke:black;stroke-width:2" />
    `;

    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
        const value = (maxAmount * i) / yTickCount;
        const y = yScale(value);
        svg.innerHTML += `
            <line 
                x1="${margin.left - 5}" 
                y1="${y}" 
                x2="${margin.left}" 
                y2="${y}" 
                style="stroke:black;stroke-width:1" 
            />
            <text 
                x="${margin.left - 10}" 
                y="${y}" 
                text-anchor="end" 
                alignment-baseline="middle" 
                style="font-size:12px"
            >${value.toFixed(1)}k</text>
        `;
    }

    arrObj.forEach((d, i) => {
        const x = cordinateX(i);
        const y = yScale(d.amount);
        const barHeight = chartHeight - y + margin.top;

        svg.innerHTML += `
            <rect 
                x="${x}" 
                y="${y}" 
                width="${barWidth}" 
                height="${barHeight}" 
                fill="steelblue"
                data-project="${d.path}"
                data-amount="${d.amount}"
            />
            <text 
                x="${x + barWidth / 2}" 
                y="${y - 5}" 
                text-anchor="middle" 
                style="font-size:12px"
            >${d.amount.toFixed(1)}</text>
            <text 
                x="${x + barWidth / 2}" 
                y="${height - margin.bottom + 35}" 
                text-anchor="middle" 
                style="font-size:10px"
                transform="rotate(45, ${x + barWidth / 2}, ${height - margin.bottom + 30})"
            >${d.path}</text>
        `;
    });

    let rectDetail = document.getElementById('rectDetail');
    svg.addEventListener('mousemove', (e) => {
        const target = e.target;
        if (target.tagName === 'rect') {
            rectDetail.style.display = "block";
            rectDetail.style.left = `${e.pageX + 10}px`;
            rectDetail.style.top = `${e.pageY - 10}px`;
            rectDetail.textContent = `Project: ${target.dataset.project}, XP: ${target.dataset.amount}k`;
        } else {
            rectDetail.style.display = "none";
        }
    });

    let xpProject = document.getElementById('xpProject')
    xpProject.appendChild(svg);
}
