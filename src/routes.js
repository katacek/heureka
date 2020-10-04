const Apify = require('apify');
const urlClass = require('url');

//const { utils: { log } } = Apify;

// at this point, the main page is already loaded in $
exports.handleStart = async ({ $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    //start page, add all categories links to requestQueue
    //const links = $( "a[data-type='subcategory']" ).map(function ()
    //{ return $(this).attr('href'); }).get();
    const links =  $('div.subsec').find('a').map(function () {return $(this).attr('href');}).get()
    
    for (let link of links)
    {   
        // request is an object, setting url to link and in userdata, setting new dictionary label: LIST
        // it is me who is setting the label value, just using it for making the crawler fcn more clear
        await requestQueue.addRequest({
            url: link,
            userData: { label: 'LIST' }
        });
    }

};

exports.handleList = async ({ request, $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    //add detail pages of all products on the page to requestQueue
    const links = $( ".c-product__link" ).map(function ()
    { return $(this).attr('href'); }).get();
    for (let link of links)
    {
        await requestQueue.addRequest({
            url: link,
            userData: { label: 'DETAIL' }
        });
    }

    //add next page to requestQueue, if exists
    const nextLink = $('a[rel=next]').attr("href");
        
    if (nextLink)
    {
        const absoluteLink = urlClass.resolve(request.url, nextLink);
        await requestQueue.addRequest({
            url: absoluteLink,
            userData: { label: 'LIST' }
        });
    }
    
};

exports.handleDetail = async ({ request, $ }) =>
{
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

    const shopsDiv = $('div .shopspr.bottom').children().get()
    for (i = 0; i < shopsDiv.length; i++)
    {
        result.shop[i].name = $("p .shop-name").text();
        result.shop[i].price = $("a.pricen").text();
        result.shop[i].numberOfReviews = parseInt($("a.prov__reviews-link").text());
    }
    //console.log(result)

    // Specification
    // TODO" figure out how to get to the new link and add info to the same dictionary at the same time
    // if I am on specs link, following info to download

    result.productSpec = $("div #full-product-description").text();

    const paramTableRows = $(".product-body__specification__params__table tr").get();
    // TODO: skip the first row as it is just headline
    for (i = 0; i < paramTableRows.length; i++)
    {
        result.productSpec[i].name = $("tr span[id*=param-name]").text();
        result.productSpec[i].value = $("tr span[id*=param-value]").text();
    } 

    // Recenze
    // TODO" figure out how to get to the new link and add info to the same dictionary at the same time
    // if I am on reviews link, following info to download

    // TODO: what if negative recomm
    result.recommended = $(".recommendation span").text()

    Apify.pushData(result)
};