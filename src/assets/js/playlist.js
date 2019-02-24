let globalConfig = {
    prerender: 15
}

let app = {
    init: () => {
        console.log('App inited')
        app.ipc();
    },
    start() {
        app.ui.toggle(app.el.$loader);
        app.slide.start();
    },
    media: [],
    el: {
        $slideContainer: $('#slidecontainer'),
        $root: document.getElementById("root"),
        $loader: document.getElementById('loader'),
    },
    listen: () => {

    },
    ipc: () => {
        //init
        ipcRenderer.send('load-playlist', '')
        //reply render playlist
        ipcRenderer.on('load-playlist-reply', (event, arg) => {
            app.media = arg;
            app.start();
        })
    },
    slide: {
        start: () => {
            app.slide.next(0)
        },
        get: (slideIndex) => {
            return app.media[slideIndex]
        },
        create: (slideIndex) => {
            //check if slide
            if(app.media.length - 1 < slideIndex) return;
            //get slide data
            let thisSlide = app.slide.get(slideIndex)
            //slide-container

            let $slider = $('<div class="slide"></div>')
                .attr('data-slideindex', slideIndex)
                .data('slideData', thisSlide)
                .css('backgroundImage', `url('${app.slide.get(slideIndex).url}')`)
                .html(`
                
                    <h1 class="header header-${thisSlide.pos}">${thisSlide.name}</h1>
                
                `)
                
            return $slider
        },
        tickNextSlide: (slideIndex, secondsOffset) => {
            setTimeout(() => {
                if (slideIndex >= (app.media.length - 1)) slideIndex = 0;
                app.slide.next(slideIndex)
            }, secondsOffset * 1000);
        },
        render: (slideIndex) => {
            //check if slider is already present
            if (!$(`[data-slideindex="${slideIndex}"]`).length > 0) $(app.el.$slideContainer).append(app.slide.create(slideIndex))
            // $(app.el.$slideContainer).append(app.slide.create(slideIndex))
        },
        next: (slideIndex) => {
            $('.slide').removeClass('active')

            //get slide data
            let thisSlide = app.slide.get(slideIndex)
            // console.log(`Current slide [${slideIndex}]: `, thisSlide)

            //render current slide
            app.slide.render(slideIndex)
            $(`.slide[data-slideindex="${slideIndex}"]`).addClass('active')

            //prerender shizzles
            for (let i = 0; i < globalConfig.prerender; i++) {
                app.slide.render(slideIndex + i + 1)
            }

            //next tick
            app.slide.tickNextSlide(++slideIndex, thisSlide.seconds)
        }
    },
    ui: {
        toggle: (el, state) => {
            el.style.visibility = state ? 'visible' : 'hidden'
        }
    }
}

//after dom load
$(document).ready(() => {
    app.init()
})