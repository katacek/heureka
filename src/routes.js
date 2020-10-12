const Apify = require('apify');
const urlClass = require('url');

//const { utils: { log } } = Apify;

// at this point, the main page is already loaded in $
exports.handleStart = async ({ $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();

    const pseudoUrl = new Apify.PseudoUrl('[.*]\.heureka.cz/');

    const match = pseudoUrl.matches('https://ochrana-pleti-v-zime.heureka.cz/');
    await Apify.utils.enqueueLinks({
        $,
        requestQueue,
        baseUrl:'https://heureka.cz',
        //selector: 'a[href*=https]',
        pseudoUrls: [pseudoUrl],
        userData:{label:'LIST'}
    });

    console.log(requestQueue);
};

exports.handleList = async ({ request, $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    let baseUrl = request.url.replace(/\?f=\d+/, '');
    let regexp = baseUrl.replace('https:', '[(https:)?]');
    
    regexp += '[[^/^:]+]/';
    let pseudoUrl = new Apify.PseudoUrl(regexp);
    await Apify.utils.enqueueLinks({
        $,
        requestQueue,
        baseUrl:baseUrl,
        pseudoUrls: [pseudoUrl],
        userData:{label:'DETAIL'}
    });

    //enqueue pagination links
    baseUrl = request.url.replace(/\?f=\d+/, '');
    regexp = baseUrl + '\?f=[\\d+]';
    pseudoUrl = new Apify.PseudoUrl(regexp);
    
    await Apify.utils.enqueueLinks({
        $,
        requestQueue,
        baseUrl: baseUrl,
        pseudoUrls: [pseudoUrl],
        userData:{label:'LIST'}
    });
};


exports.handleDetail = async ({ request, $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    //parse detail page
    let result = {};
    result.itemUrl = request.url;
    result.itemName = $("h1[itemprop='name']").text().trim();
    result.currentPrice = parseInt($("span[itemprop='price']").text());
    result.breadcrumb = $('#breadcrumbs').text().trim().split('Heureka.cz » ')[1]
    result.currency = "CZK";
    if ($("div[class='top-ico gtm-header-link'] span").text() === "Top")
    {
        result.inTop = "TRUE";
    } else (
        result.inTop = "FALSE"
    )
    
    result.shop = [];
    const shopsDiv = $('div.shoppr.verified').get();
    for (i = 0; i < shopsDiv.length; i++)
    {
        //if (shopsDiv[i].name !== 'div') continue;
        result.shop.push({});
        result.shop[i].name = $('.shop-name', shopsDiv[i]).text().trim();
        result.shop[i].price = $('a.pricen', shopsDiv[i]).text();
        result.shop[i].numberOfReviews = parseInt($('a.prov__reviews-link', shopsDiv[i]).text());
    }

    const specUrl = request.url + 'specifikace/';

    //new request for specification page
    requestQueue.addRequest(
        {
            url: specUrl,
            userData:
            {
                label: 'DETAIL-SPECIFIKACE',
                result: result
            }
        });
    
};

exports.handleDetailSpecifikace = async ({ request, $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    let result = request.userData.result;
    result.specifikace = $('div#full-product-description').text();

    const paramTableRows = $(".product-body__specification__params__table tr").get();
    result.parametry = [];
    
    for (i = 1; i < paramTableRows.length; i++)
    {
        let parametr = {};
        let name = $("span[id*=param-name]", paramTableRows[i]).text();
        parametr[name] = $("span[id*=param-value]", paramTableRows[i]).text();
        result.parametry.push(parametr);
          
    }

    const reviewUrl = request.url.replace('specifikace', 'recenze');

    //new request for specification page
    requestQueue.addRequest(
        {
            url: reviewUrl,
            userData:
            {
                label: 'DETAIL-REVIEW',
                result: result
            }
        });
    };

    
    exports.handleDetailReview = async ({ request, $ }) =>
    {
        const requestQueue = await Apify.openRequestQueue();
        result = request.userData.result;

        if (request.userData.label === 'DETAIL-REVIEW')
        {
            const requestQueue = await Apify.openRequestQueue();
            let result = request.userData.result;
            result.recommendedByNumber = $(".recommendation span").text();
            const notRecommended = $(".no-recommendation span").text();
            if (notRecommended)
            {
                result.notRecommendedByNumber = $(".no-recommendation span").text();
            }
            result.overallReviewPecentage = parseInt($("div .heureka-rank-wide span.big").text());
    
            const reviewTableRows = $(".rating-table tr").get();
            result.reviewStars = {};
        
            for (i = 0; i < reviewTableRows.length; i++)
            {
                let percentage = parseInt($(".percentage", reviewTableRows[i]).text());
                result.reviewStars[5 - i] = percentage;
                
            }
        }
         //reviews
        const reviewDivs = $('div.review');
        result.reviews = [];
       
        for (i = 0; i < reviewDivs.length; i++)
        {
            let review = {};

            review.percentage = parseInt($('.eval', reviewDivs[i]).text());
            review.text = $('.revtext p',reviewDivs[i]).text();
            review.plusText = $('div.plus li',reviewDivs[i]).map(function () { return $(this).text(); }).get();
            review.minusText = $('div.minus li',reviewDivs[i]).map(function () { return $(this).text(); }).get();
            result.reviews.push(review);
        }

        const nextLink = $('a.next').attr('href');
        if (nextLink)
        {
            const baseUrl = request.url.replace(/\?f=\d+/, '');
            const nextUrl = urlClass.resolve(baseUrl, nextLink);
            requestQueue.addRequest({ url: nextUrl, userData: { label: 'DETAIL-REVIEW-NEXTPAGE', result : result } });
        }
        else
        {
            await Apify.pushData(result)
        }
};
