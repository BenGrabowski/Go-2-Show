'use strict';

const songkickApiKey = 'ZtmmBiNtoDue1K6l';
const youtubeApiKey = 'AIzaSyCXmNnQkli4umDw-wWFFsBB2q7KooLVOTY';

const songkickLocationBase = 'https://api.songkick.com/api/3.0/search/locations.json?';
const youtubeSearchBase = 'https://www.googleapis.com/youtube/v3/search';
const googlemapsDirectionsBase = 'https://www.google.com/maps/dir/?api=1&destination=';
const googlemapsEmbedBase = 'https://www.google.com/maps/embed/v1/search?';

//Get metro ID using location API
function getMetroID(city, startDate, endDate, maxResults) {
    console.log('getMetroID ran');
    const params = {
        apikey: songkickApiKey,
        query: city
    };
    const queryString = formatParams(params);
    const url = songkickLocationBase + queryString;

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        } throw new Error(response.statusText)
    })
    // .then(responseJson => console.log(responseJson.resultsPage.results.location[0].metroArea.id, startDate, endDate))
    .then(responseJson => getConcerts(responseJson.resultsPage.results.location[0].metroArea.id, startDate, endDate, maxResults))
    .catch(error => {
        $('#error').text(`Something Went Wrong: ${error.message}`);
    });

}

//Get list of concerts from Songkick
function getConcerts(metroID, startDate, endDate, maxResults) {
    console.log('getConcerts ran');
    console.log(metroID, startDate, endDate);
    const params = {
        apikey: songkickApiKey,
        min_date: startDate,
        max_date: endDate,
        per_page: maxResults
    };

    const queryString = formatParams(params);
    console.log(queryString);
    let url = `https://api.songkick.com/api/3.0/metro_areas/${metroID}/calendar.json?` + queryString;
    console.log(url);

    fetch(url)
    .then(response => {
        if(response.ok) {
            return response.json();
        } throw new Error(response.statusText);
    })
    // .then(responseJson => console.log(responseJson))
    .then(responseJson => displayConcerts(responseJson))
    .catch(error => {
        $('#error').text(`Something Went Wrong: ${error.message}`);
    });
}

//Format params into query string
function formatParams(params) {
    console.log('formatParams ran');
    const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function getConcertAddress(venueID) {
    const params = {
        apikey: songkickApiKey,
        venue_id: venueID
    };

    const queryString = formatParams(params);
    const url = `https://api.songkick.com/api/3.0/venues/${venueID}.json?apikey=${songkickApiKey}`;

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        } throw new Error (response.statusText)
    })
    // .then(responseJson => console.log(responseJson))
    .then(responseJson => formatAddress(responseJson))
    .catch(error => {
        $('#error').text(`Something Went Wrong: ${error.message}`);
    });
}

function displayConcerts(responseJson) {
    console.log('displayConcerts ran');
    $('#concert-results').empty();
    const eventArray = responseJson.resultsPage.results.event;
    for (let i = 0; i < eventArray.length; i++) {
        //create <li> for each concert here
        $('#concert-results').append(
            `<li>
                <p class="artist-name" target="_blank">
                ${responseJson.resultsPage.results.event[i].performance[0].artist.displayName}
                </p>
                
                <p class="concert-date">${responseJson.resultsPage.results.event[i].start.date}</p>
                
                <p class="venue">${responseJson.resultsPage.results.event[i].venue.displayName}</p>

                <p class="venue-id">${responseJson.resultsPage.results.event[i].venue.id}</p>
                
                <a href="${responseJson.resultsPage.results.event[i].uri}" class="songkick-link" target="_blank">
                SongKick Event
                </a>
            </li>`
        );
    };
}

//Call the YouTube API to get video ID's
function getVideos(artistName) {
    console.log('getVideos ran');
    const params = {
        key: youtubeApiKey,
        q: artistName,
        type: 'video',
        order: 'relevance',
        maxResults: '10',
        part: 'snippet'
    };

    const queryString = formatParams(params);
    let url = youtubeSearchBase + '?' + queryString;
    console.log(url);

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        } throw new Error(response.statusText);
    })
    // .then(responseJson => console.log(responseJson))
    .then(responseJson => getVideoIDs(responseJson))
    .catch(error => {
        $('#error').text(`Something Went Wrong: ${error.message}`);
    });
}

//Put video ID's into object
function getVideoIDs(responseJson) {
    console.log('getvideos ran');
    const videos = [];
    for (let i = 0; i < responseJson.items.length; i++) {
        videos.push(responseJson.items[i].id.videoId);
    }
    console.log(videos);
    const videoString = videos.toString();
    console.log(videoString);
    generatePlaylist(videoString);
}

//Generate YouTube video playlist
function generatePlaylist(videoString){
    const playlist = `<iframe width="720" height="405" 
        src="https://www.youtube.com/embed/VIDEO_ID?playlist=${videoString}" frameborder="0" allowfullscreen>`;
    
    $('#youtube-player').append(playlist);
}

function formatAddress(responseJson) {
    const streetAddress = responseJson.resultsPage.results.venue.street;
    const venueCity = responseJson.resultsPage.results.venue.city.displayName;
    const venueState = responseJson.resultsPage.results.venue.city.state.displayName;
    const venueZip = responseJson.resultsPage.results.venue.zip;

    const fullAddress = streetAddress + " " + venueCity + ',' + " " + venueState + " " + venueZip;
    console.log(fullAddress);
    displayMap(fullAddress);

 }


function displayMap(fullAddress) {
    const params = {
        key: youtubeApiKey,
        q: fullAddress
    }; 
    
    const mapsQuery = formatParams(params);
    const mapsEmbedUrl = googlemapsEmbedBase + mapsQuery;
    console.log(mapsEmbedUrl);
    
    let mapEl = 
        `<iframe width="600" height="450" frameborder="0" style="border:0"
        src="${mapsEmbedUrl}" allowfullscreen>
        </iframe>`
    $('#map').append(mapEl);
}

function formatDestinationParams(venueName) {
    console.log('formatDestinationParams ran');
    let queryString = encodeURIComponent(venueName);
    return queryString;
}

function handleSubmit(){
    $('#submit').on('click', event => {
        event.preventDefault();
        $('#youtube-player').empty();
        $('#map').empty();
        const city = $('input[name=location]').val();
        const startDate = $('input[name=start-date]').val();
        const endDate = $('input[name=end-date]').val();
        const maxResults = $('input[name=max-results').val();
        getMetroID(city, startDate, endDate, maxResults);
    });
}

//event listener for user clicking on artist name
function handleArtistClick() {
    $('#concert-results').on('click', '.artist-name', event => {
        event.preventDefault();
        $('#youtube-player').empty();
        let artistName = $(event.target).text().trim();
        console.log(artistName);
        getVideos(artistName);
        // getArtistURI(artistName);
    });
}

function handleVenueClick() {
    $('#concert-results').on('click', '.venue', event => {
        $('#map').empty();
        let venueName = $(event.target).text();
        let venueID = $(event.target).next().text();
        console.log(venueName);
        console.log(venueID);
        const venueQuery = formatDestinationParams(venueName);
        const directionsUrl = googlemapsDirectionsBase + venueQuery;
        // window.open(directionsUrl);
        // console.log(venueQuery);
        getConcertAddress(venueID);
        // displayMap(venueQuery);
    });
}

function runApp() {
    handleSubmit();
    handleArtistClick();
    handleVenueClick();
}

$(runApp);