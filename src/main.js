const Apify = require('apify');
const { handleStart, handleList, handleDetail, handleDetailSpecifikace, handleDetailReview } = require('./routes');

const { utils: { log } } = Apify;

Apify.main(async () => {
    //const { startUrls } = await Apify.getInput();

    //const requestList = await Apify.openRequestList('start-urls', startUrls);
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest(
        {
            url: "https://pletova-kosmetika.heureka.cz/",
           
                });
    
    await requestQueue.addRequest(
        {
            url: "https://slunecni-ochrana.heureka.cz/ ",
            
                });
    
    await requestQueue.addRequest(
        {
            url: "https://telova-kosmetika.heureka.cz/",
            
                });
    
    const proxyConfiguration = await Apify.createProxyConfiguration({
    groups: ['CZECH_LUMINATI'], // List of Apify Proxy groups
    countryCode: 'CZ',
    });

    
    const crawler = new Apify.CheerioCrawler({
       // requestList,
        requestQueue,
        useApifyProxy: true,
        proxyConfiguration,
        useSessionPool: false,
        //persistCookiesPerSession: true,
        // Be nice to the websites.
        // Remove to unleash full power.
        //maxConcurrency:10,
        handlePageTimeoutSecs:60000,
       
       // context is made up by crawler, it contains $, page body, request url, response and session
        handlePageFunction: async (context) =>
        {
            //no cars please
            if (context.request.url.includes('auta.heureka.cz')) return;
            
            // from context.request get url and put it to const url (alias url = context.request.url)
            // moreover, get userdata, and from them get label and put it to label 
            // alias (label = context.request.userData.label)
            const { url, userData: { label } } = context.request;
            console.log('Page opened.', { label, url });
            log.info('Page opened.', { label, url });
            switch (label) {
                case 'LIST':
                    return handleList(context);
                case 'DETAIL':
                    return handleDetail(context);
                case 'DETAIL-SPECIFIKACE':
                    return handleDetailSpecifikace(context);
                case 'DETAIL-REVIEW':
                    return handleDetailReview(context);
                case 'DETAIL-REVIEW-NEXT-PAGE':
                    return handleDetailReview(context);
                default:
                    return handleStart(context);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
