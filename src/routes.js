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
    const links = $('div#box-categories').find('li').map(function ()
    { return $(this).find('a').attr('href'); }).get();
    let count = 0;
    for (let link of links)
    {   
        count++;
        if (count > 10) break;
        // request is an object, setting url to link and in userdata, setting new dictionary label: LIST
        // it is me who is setting the label value, just using it for making the crawler fcn more clear

         await requestQueue.addRequest({
            url: link,
             userData: { label: 'LIST' },
            // headers: {
            //     "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            //     "accept-language": "cs,en;q=0.9,en-US;q=0.8,es;q=0.7,de;q=0.6,ru;q=0.5,sk;q=0.4,pl;q=0.3",
            //     "sec-fetch-dest": "document",
            //     "sec-fetch-mode": "navigate",
            //     "sec-fetch-site": "none",
            //     "sec-fetch-user": "?1",
            //     "upgrade-insecure-requests": "1",
            //     "cookie": "hrk_dv=1; heureka_user_split_id=6203; heureka_privacy-prompt=1; __gfp_64b=zyth5wfVzzmyLyYG.zfetmm_KnTa28vMt.lVVCMcGy..s7; _ga=GA1.2.49470240.1578492130; _hjid=9feb9ad9-5b2a-4a03-a2db-79bab582aa40; heureka_s=OK; heureka_device_detected=desktop; heureka_uz=c07da78086b4d7c7c9fcda09965f049a; heureka_gtm_visitor_cache=%7B%22gtm%3Avisitor%3Aid%22%3A%22-1%22%2C%22gtm%3Avisitor%3AloginState%22%3A%22anonymous%22%2C%22gtm%3Avisitor%3AhashedEmail%22%3A%22N%2FA%22%7D; _gcl_au=1.1.775401797.1598529539; widget_capping_555328=1; adblocker=active; _gcl_aw=GCL.1601160573.EAIaIQobChMI2Pmi4vOH7AIVjM_tCh2afA8TEAYYASABEgLCb_D_BwE; _gac_UA-46152022-1=1.1601160574.EAIaIQobChMI2Pmi4vOH7AIVjM_tCh2afA8TEAYYASABEgLCb_D_BwE; _gaexp=GAX1.2.P_IX3eveQ86wUEtycMgJIw.18623.2; _gid=GA1.2.854472621.1601997780; _fbp=fb.1.1601998135683.444976818; __gads=ID=6f6780f605049bb0:T=1601998132:S=ALNI_MY-DCEzav6bTgFkLEfRt6JBHnnufA; heureka_css=15a9e6%2C2ad5ca%2C1b4fab%2Cbdaefb%2Cb8f78f%2C235ea9%2C196e92%2Cbaa767%2C18d0c9%2Cb5e8f7%2C78aa1d%2Cc82e58%2Cb7f7d2; _uetsid=6fba13b0096f11eba22587adf6ead8d5; _uetvid=88330434211e0699719cbd4326ea7b62"
            //   },
        });
    }

};

exports.handleList = async ({ request, $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    //add detail pages of all products on the page to requestQueue
    const links = $( ".product-container" ).map(function ()
    { return $(this).find('a').attr('href'); }).get();
    let count = 0;
    for (let link of links)
    {
        count++;
        if (count > 10) break;
        const absoluteLink = urlClass.resolve(request.url, link);
        await requestQueue.addRequest({
            url: absoluteLink,
            userData: { label: 'DETAIL' },
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "en-US,en;q=0.9",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1"
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
        });
    }

    
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
        let result = request.userData.result;
        result.recommendedByNumber = $(".recommendation span").text();
        const notRecommended = $(".no-recommendation span").text();
        if (notRecommended) {
            result.notRecommendedByNumber = $(".no-recommendation span").text();
        }
        result.overallReviewPecentage = parseInt($("div .heureka-rank-wide span.big").text());
    
        const reviewTableRows = $(".rating-table tr").get();
        result.reviewStars = {};
        
        for (i = 0; i < reviewTableRows.length; i++)
        {
            let percentage = parseInt($(".percentage", reviewTableRows[i]).text());
            result.reviewStars[5-i] = percentage;
                
        }

        await Apify.pushData(result)
};



    
