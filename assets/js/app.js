const WEATHER_API = {
    key: "3c13c568e5fa599606390814852213b4",
    ForecastUrl: "https://api.openweathermap.org/data/2.5/onecall",
    indexBaseUrl : "https://api.openweathermap.org/data/2.5/uvi/forecast",
    iconBaseUrl : "https://openweathermap.org/img/w/",
    geoCodingUrl : "http://api.openweathermap.org/geo/1.0/direct"
}


const searchInputBox = document.getElementById('input-box');
const searchButton = document.getElementById('search-button');
const listParent = document.getElementById('search-list');

var history_data;


function init(){
    history_data = localStorage.getItem('data')==null ? [] : JSON.parse(localStorage.getItem('data'));
    history_data = Array.from(new Set(history_data));
    for(let data of history_data) updateSearch(data);
}

async function searchFromHistory(event) {
    if(event.target !== event.currentTarget) return;
    await weatherForecast(event.currentTarget.dataset.city);
}

function saveSearch() {
    localStorage.setItem('data',JSON.stringify(history_data));
}

function removeSearch(event) {
    if(event.target !== event.currentTarget) return;

    let city = event.currentTarget.dataset.city;
    event.currentTarget.parentElement.remove();

    let indexFromArray = history_data.indexOf(city);
    if (indexFromArray !== -1) history_data.splice(indexFromArray, 1);

    saveSearch();
}

function updateSearch(city) {
    let list = document.createElement("LI");
    let span = document.createElement("SPAN");

    span.onclick = (e)=> removeSearch(e);
    span.innerHTML='&times;';
    span.dataset.city=city;

    list.onclick = (e)=>searchFromHistory(e);
    list.innerText=city;
    list.className = "list-group-item list-group-item-action";
    list.dataset.city=city;
    list.appendChild(span);
    listParent.appendChild(list);

}

function addSearch(city) {
    if(history_data.indexOf(city) !== -1) return;
    history_data.push(city);

    updateSearch(city);
    saveSearch();

}


function reset() {
    document.querySelector('.body').style.visibility = "hidden";
    document.getElementById('error').innerText=`Invalid!`;

}

async function weatherForecast(val) {
    const Geo = await getGeo(val);

    if(Geo.success) {
        const weatherInfo = await getWeather(Geo.lat, Geo.lon); 

        if(weatherInfo.success){
            document.getElementById('error').innerText=``;
            displayWeather(Geo.city,weatherInfo.data); 
            document.querySelector('.body').style.visibility = "visible";
            addSearch(Geo.city);
        } else {
           reset();
        }

    } else {
        reset();
    }
}

searchButton.onclick = async function(){
    await weatherForecast(searchInputBox.value);
}
searchInputBox.addEventListener('keypress', async (event)=> {
    if(event.key == "Enter") {
        await weatherForecast(searchInputBox.value);
    }
});

async function getGeo(city) {
    try{
        const response = await fetch(`${WEATHER_API.geoCodingUrl}?q=${city}&appid=${WEATHER_API.key}`);

        if(response.ok) {
            const geo = await response.json();
            const lat = geo[0].lat;
            const lon = geo[0].lon;
            const city = geo[0].name;
            return {success: true, lat: lat, lon:lon, city:city};
        }
        return {success: false, error: response.statusText};

    } catch(err){
        return {success: false, error: err.message};
    }
}

async function getWeather(lat, lon) {
    
    try {
        const response = await fetch(`${WEATHER_API.ForecastUrl}?lat=${lat}&lon=${lon}&exclude=hourly,minutely&units=imperial&appid=${WEATHER_API.key}`); 

        if(response.ok) {          
            const forecast = await response.json();
            return {success: true, data: forecast};      
        }
        return {success: false, error: response.statusText};

    } catch (err) {
        return {success: false, error: err.message};
    }

};

function UvIndexColor(uv_value,uv_element) {
    if(uv_value<3) uv_element.className =("btn btn-success");
    else if (uv_value<6) uv_element.className = ("btn btn-warning");
    else uv_element.className = ("btn btn-danger");
        
}

function displayWeather(city,data) {
    data.daily[0]=data.current;

    let City = document.getElementById('city');
    City.innerText=`${city} `

    let windspeed = document.getElementById('windspeed-0');
    windspeed.innerText = `WindSpeed: ${(data.current.wind_speed)} MPH`;

    let index = document.getElementById('index-0');
    let uvi_value= (data.current.uvi);
    UvIndexColor(uvi_value,index);
    index.innerText=`${uvi_value}`;
    

    
    for(var i=0;i<=5;i++){
       
        let temperature = document.getElementById('temp-'+i);
        temperature.innerHTML = i>0 ? `Temp: ${(data.daily[i].temp.day)}&deg;F` :`Temperature: ${(data.daily[i].temp)}&deg;F` ;

        let humidity = document.getElementById('humidity-'+i);
        humidity.innerText = i>0 ? `Humidity: ${(data.daily[i].humidity)}%` : `Humidity: ${(data.daily[i].humidity)}%`;
       
        let todayDate = new Date();
        let date = document.getElementById('date-'+i);
        todayDate.setDate(todayDate.getDate()+i);
        date.innerText = dateManage(todayDate,i);

        let iconUrl = WEATHER_API.iconBaseUrl+data.daily[i].weather[0].icon+".png";
        document.getElementById("icon-"+i).src =iconUrl;
    }
}

function dateManage(dateArg,i) {
    let year = dateArg.getFullYear();
    let month = dateArg.getMonth()+1;
    let date = dateArg.getDate();
    return i>0 ? `${month}/${date}/${year}` : `(${month}/${date}/${year}) ` ;
} 

init();
