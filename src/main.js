const Apify = require('apify');
const { handleStart, handleList, handleDetail } = require('./routes');

const { utils: { log } } = Apify;

Apify.main(async () => {
    //const { startUrls } = await Apify.getInput();

    //const requestList = await Apify.openRequestList('start-urls', startUrls);
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: "https://pletova-kosmetika.heureka.cz/" });

    const crawler = new Apify.CheerioCrawler({
       // requestList,
        requestQueue,
        //useApifyProxy: true,
        useSessionPool: true,
        persistCookiesPerSession: true,
        // Be nice to the websites.
        // Remove to unleash full power.
        maxConcurrency: 50,
        handlePageTimeoutSecs:600,
       
       // context is made up by crawler, it contains $, page body, request url, response and session
        handlePageFunction: async (context) => {
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
                default:
                    return handleStart(context);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});