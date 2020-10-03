const Apify = require('apify');

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

exports.handleList = async ({ $ }) =>
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
    // TODO - loaded dynamically by addinf number to url
    // const nextLink = $('a.next').attr('href');
    // if (nextLink)
    // {
    //     await requestQueue.addRequest({
    //         url: nextLink,
    //         userData: { label: 'LIST' }
    //     });
    // }
    
};

exports.handleDetail = async ({ request, $ }) => {
    //parse detail page

    let result = {};
    result.itemUrl = request.url;
    result.itemName = $("h1[itemprop='name']").text().trim();
    result.currentPrice = parseInt($("span[itemprop='price']").text());
    result.breadcrumb = $('#breadcrumbs').text().trim().split('Heureka.cz » ')[1]
    result.currency = "CZK";
    
    Apify.pushData(result)
};