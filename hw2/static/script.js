

document.getElementById('stockSymbol').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        triggerSearch();
    }
});

document.getElementById('searchButton').addEventListener('click', triggerSearch);

document.getElementById('clearButton').addEventListener('click', function() {
    document.getElementById('stockSymbol').value = '';
    document.getElementById('search_result').style.display = 'none';
    document.getElementById('error_search_result').style.display = 'none';
    resetActiveTab();
});

function resetActiveTab() {
    // Hide all tab contents
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    // Remove active class from all tab links
    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    // Show the outlook content by default and add active class to the Company tab
    document.getElementById('outlook-content').style.display = 'block';
    var companyTabLink = document.querySelector(".tablinks");
    if (companyTabLink) {
        companyTabLink.className += " active";
    }
}

function triggerSearch() {
    var input = document.getElementById('stockSymbol');
    var value = input.value.trim();
    if (!value) {
        // Trigger browser's default form validation message
        input.reportValidity();
    } else {
        // Proceed with the search function if input is not empty
        searchStock(value);
        resetActiveTab();
    }
}

function searchStock(stockSymbol) {

    console.log('Searching for:', stockSymbol);

    fetch('/search?ticker=' + encodeURIComponent(stockSymbol))
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const isDataEmpty = checkIfDataIsEmpty(data);

            if (isDataEmpty) {

                document.getElementById('search_result').style.display = 'none';
                document.getElementById('error_search_result').style.display = 'block';
            } else {
                // Data found, process and display
                updateSearchResults(data);
                document.getElementById('error_search_result').style.display = 'none';
                document.getElementById('search_result').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching data: ', error);
            // Show error message div
            document.getElementById('search_result').style.display = 'none';
            document.getElementById('error_search_result').style.display = 'block';
        });
}

function checkIfDataIsEmpty(data) {
    // Parse each part of the data to check if it's empty or just contains default/placeholder values
    const profileEmpty = data.profile === '{}' || !data.profile;
    const quoteEmpty = data.quote === '{"c":0,"d":null,"dp":null,"h":0,"l":0,"o":0,"pc":0,"t":0}' || !data.quote;
    const recommendationEmpty = data.recommendation === '[]' || !data.recommendation;
    const chartsEmpty = data.charts && JSON.parse(data.charts).resultsCount === 0;
    const newsEmpty = data.news === '[]' || !data.news;

    // Consider data empty if all parts are empty or contain placeholder values
    return profileEmpty && quoteEmpty && recommendationEmpty && chartsEmpty && newsEmpty;
}

function updateSearchResults(data) {
    //********************************************Outlook***********************************
    const profileData = JSON.parse(data.profile);
    // Check if profile data is not empty
    if (profileData && Object.keys(profileData).length > 0) {
        document.getElementById('logo-img').src = profileData.logo; // Set the logo image
        document.getElementById('logo-img').alt = profileData.name + " Logo"; // Set the alt text for the logo
        // Set the content of each cell
        document.getElementById('company-name').textContent = profileData.name;
        document.getElementById('stock-symbol').textContent = profileData.ticker;
        document.getElementById('exchange-code').textContent = profileData.exchange;
        document.getElementById('ipo-date').textContent = profileData.ipo;
        document.getElementById('category').textContent = profileData.finnhubIndustry;

        // Show the outlook content
        document.getElementById('outlook-content').style.display = 'block';
    } else {
        // If no profile data is present, hide the outlook content
        document.getElementById('outlook-content').style.display = 'none';
    }
    //********************************************Outlook***********************************


    //********************************************Summary***********************************

    const quoteData = JSON.parse(data.quote);
    if (quoteData && Object.keys(quoteData).length > 0) {
        // Update the content of each cell
        document.getElementById('summary-symbol').textContent = data.profile ? JSON.parse(data.profile).ticker : 'N/A'; // Using ticker from profile data
        document.getElementById('summary-trading-day').textContent = new Date(quoteData.t * 1000).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('summary-prev-close').textContent = quoteData.pc.toFixed(2);
        document.getElementById('summary-open').textContent = quoteData.o.toFixed(2);
        document.getElementById('summary-high').textContent = quoteData.h.toFixed(2);
        document.getElementById('summary-low').textContent = quoteData.l.toFixed(2);

        // Calculate and display Change and Change Percent with arrows
        const change = quoteData.d || quoteData.c - quoteData.pc; // If 'd' is not present, calculate change
        const changePercent = quoteData.dp || (change / quoteData.pc) * 100; // If 'dp' is not present, calculate change percent
        const changeElement = document.getElementById('summary-change');
        const changePercentElement = document.getElementById('summary-change-percent');

        changeElement.innerHTML = change.toFixed(2) + (change < 0 ? ' 🔻' : ' 🔺');
        changePercentElement.innerHTML = changePercent.toFixed(2) + '%' + (changePercent < 0 ? ' 🔻' : ' 🔺');

        // Add color coding based on positive or negative values
        changeElement.className = change < 0 ? 'change-negative' : 'change-positive';
        changePercentElement.className = changePercent < 0 ? 'change-negative' : 'change-positive';
    }
    // Parse the recommendation data
    const recommendationData = JSON.parse(data.recommendation);
    if (recommendationData && recommendationData.length > 0) {
        // Get the most recent recommendation
        const latestRecommendation = recommendationData[recommendationData.length - 1];

        // Update the content of each recommendation box
        document.getElementById('strong-sell').textContent = latestRecommendation.strongSell;
        document.getElementById('sell').textContent = latestRecommendation.sell;
        document.getElementById('hold').textContent = latestRecommendation.hold;
        document.getElementById('buy').textContent = latestRecommendation.buy;
        document.getElementById('strong-buy').textContent = latestRecommendation.strongBuy;
    }
    //********************************************  Summary   ***********************************

    //********************************************  chart   ***********************************
    const  chartsData=JSON.parse(data.charts);
    // console.log(chartsData);


    const charts = JSON.parse(data.charts);
    var stockPrice = [];
    var volume = [];
    let maxDate = 0;
    let minDate = new Date();
    let maxVolume = 0;

    for (var i = 0; i < charts.results.length; i++) {
        // Convert Unix timestamp to JavaScript timestamp (milliseconds)
        const dateInMillis = charts.results[i].t;

        // Update min and max date
        maxDate = Math.max(maxDate, dateInMillis);
        minDate = Math.min(minDate, dateInMillis);

        // Update max volume
        maxVolume = Math.max(maxVolume, charts.results[i].v);

        // Push stock price data
        stockPrice.push([
            dateInMillis,
            charts.results[i].c // Close price
        ]);

        // Push volume data
        volume.push([
            dateInMillis,
            charts.results[i].v // Volume
        ]);
    }
    Highcharts.stockChart('charts-area', {
        rangeSelector: {
            allButtonsEnabled: true,
            buttons: [{
                type: 'week',
                count: 1,
                text: '7d',
                dataGrouping: {
                    forced: true,
                    units: [['day', [1]]]
                }
            }, {
                type: 'day',
                count: 15,
                text: '15d',
                dataGrouping: {
                    forced: true,
                    units: [['day', [1]]]
                }
            }, {
                type: 'month',
                count: 1,
                text: '1m',
                dataGrouping: {
                    forced: true,
                    units: [['day', [1]]]
                }
            }, {
                type: 'month',
                count: 3,
                text: '3m',
                dataGrouping: {
                    forced: true,
                    units: [['week', [1]]]
                }
            }, {
                type: 'month',
                count: 6,
                text: '6m',
                dataGrouping: {
                    forced: true,
                    units: [['month', [1]]]
                }
            }],
            buttonTheme: {
                width: 30
            },
            selected: 4 // 0-based index to which button is selected by default
        },
        chart: {
            zoomType: 'x'
        },
        title: {
            text: `Stock Price ${profileData.name} ${new Date().toISOString().split('T')[0]}`
        },
        subtitle: {
            text: 'Source: <a href="https://polygon.io/" target="_blank">Polygon.io</a>',
            style:{
                color:'#1a0dab',
                textDecoration: 'underline',
                margin: '20px'
            }
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Date'
            }
        },
        yAxis: [{
            title: {
                text: 'Stock Price'
            },
            opposite: false
        }, {
            title: {
                text: 'Volume'
            },
            labels: {
                formatter: function() { return (this.value / 1000000) + 'M';}
            },
            opposite: true
        }],
        series: [{
            name: 'Stock Price',
            data: stockPrice,
            type: 'area',
            tooltip: {
                valueDecimals: 2
            },
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            },
            dataGrouping: {
                enabled: false, // This will prevent Highcharts from grouping the data
            }
        }, {
            name: 'Volume',
            data: volume,
            type: 'column',
            pointPadding: 0, // Typically a small value between 0 and 0.1
            groupPadding: 0.1, // Adjust this value to control the spacing between columns
            pointWidth: 5, // Adjust the width of each column here
            dataGrouping: {
                enabled: false, // This will prevent Highcharts from grouping the data
            },
            yAxis: 1,
            tooltip: {
                valueDecimals: 0
            },
            color: 'gray'
        }],
        credits: {
            enabled: false
        },
        exporting: {
            enabled: true
        }
    });

    //********************************************  chart   ***********************************

    //********************************************Latest News***********************************
    const newsData = JSON.parse(data.news);
    if (newsData && newsData.length > 0) {
        const newsContentDiv = document.getElementById('news-content');
        // Clear previous news articles
        newsContentDiv.innerHTML = '';

        // Loop through the first five news articles with complete data
        newsData.slice(0, 5).forEach(newsItem => {
            if (newsItem.image && newsItem.headline && newsItem.datetime && newsItem.url) {
                // Convert timestamp to human-readable date
                const newsDate = new Date(newsItem.datetime * 1000);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                const formattedDate = newsDate.toLocaleDateString('en-GB', options);

                // Construct the news card HTML
                const newsCardHTML = `
                    <div class="news-card">
                        <img src="${newsItem.image}" alt="News Image">
                        <div class="news-info">
                            <div class="news-title">${newsItem.headline}</div>
                            <div class="news-date">${formattedDate}</div>
                            <a href="${newsItem.url}" target="_blank" class="news-link">See Original Post</a>
                        </div>
                    </div>
                `;

                // Append the news card to the news-content div
                newsContentDiv.innerHTML += newsCardHTML;
            }
        });
    }


}

function openTab(event, tabName) {
    // Get all elements with class="tabcontent" and hide them
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}


