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
            // headers:
            // {
            //     "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            //    "accept-language": "cs,en;q=0.9,en-US;q=0.8,es;q=0.7,de;q=0.6,ru;q=0.5,sk;q=0.4,pl;q=0.3",
            //    "sec-fetch-dest": "document",
            //    "sec-fetch-mode": "navigate",
            //    "sec-fetch-site": "none",
            //    "sec-fetch-user": "?1",
            //    "upgrade-insecure-requests": "1",
            //    // "cookie": "hrk_dv=1; heureka_user_split_id=6203; heureka_privacy-prompt=1; __gfp_64b=zyth5wfVzzmyLyYG.zfetmm_KnTa28vMt.lVVCMcGy..s7; _ga=GA1.2.49470240.1578492130; _hjid=9feb9ad9-5b2a-4a03-a2db-79bab582aa40; heureka_s=OK; heureka_device_detected=desktop; heureka_uz=c07da78086b4d7c7c9fcda09965f049a; heureka_gtm_visitor_cache=%7B%22gtm%3Avisitor%3Aid%22%3A%22-1%22%2C%22gtm%3Avisitor%3AloginState%22%3A%22anonymous%22%2C%22gtm%3Avisitor%3AhashedEmail%22%3A%22N%2FA%22%7D; _gcl_au=1.1.775401797.1598529539; widget_capping_555328=1; adblocker=active; _gcl_aw=GCL.1601160573.EAIaIQobChMI2Pmi4vOH7AIVjM_tCh2afA8TEAYYASABEgLCb_D_BwE; _gac_UA-46152022-1=1.1601160574.EAIaIQobChMI2Pmi4vOH7AIVjM_tCh2afA8TEAYYASABEgLCb_D_BwE; _gaexp=GAX1.2.P_IX3eveQ86wUEtycMgJIw.18623.2; _gid=GA1.2.854472621.1601997780; _fbp=fb.1.1601998135683.444976818; __gads=ID=6f6780f605049bb0:T=1601998132:S=ALNI_MY-DCEzav6bTgFkLEfRt6JBHnnufA; heureka_css=15a9e6%2C2ad5ca%2C1b4fab%2Cbdaefb%2Cb8f78f%2C235ea9%2C196e92%2Cbaa767%2C18d0c9%2Cb5e8f7%2C78aa1d%2Cc82e58%2Cb7f7d2; _uetsid=6fba13b0096f11eba22587adf6ead8d5; _uetvid=88330434211e0699719cbd4326ea7b62"
            // }
        });

    const crawler = new Apify.CheerioCrawler({
       // requestList,
        requestQueue,
        //useApifyProxy: true,
        useSessionPool: false,
        //persistCookiesPerSession: true,
        // Be nice to the websites.
        // Remove to unleash full power.
        maxConcurrency:1,
        handlePageTimeoutSecs:60000,
       
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
                case 'DETAIL-SPECIFIKACE':
                    return handleDetailSpecifikace(context);
                case 'DETAIL-REVIEW':
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
