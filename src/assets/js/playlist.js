let globalConfig = {
    prerender: 15
}

let app = {
    init: () => {
        console.log('App inited')
        app.socketHandler();
        app.ipc();
    },
    start() {
        console.log(`Start`)
        app.ui.toggle(app.el.$loader);
        app.slide.start();
        app.view.renderLogo();
    },
    media: [],
    screen: {},
    logo: "",
    socket: {},
    el: {
        $slideContainer: $('#slidecontainer'),
        $logoContainer: $('#logocontainer'),
        $root: document.getElementById("root"),
        $loader: document.getElementById('loader'),
    },
    listen: () => {

    },

    socketHandler(){
        app.socket = io('http://localhost:3000');
        app.socket.on('refresh', (data) => {
            console.log(`Refreshed`)
            remote.getCurrentWindow().reload();
        });
        app.socket.on('connect', function () {
            // Connected, let's sign-up for to receive messages for this screen
            if(app.screen.name){
                app.socket.emit('screen', app.screen.name);                
            }
        });
    },
    ipc: () => {
        //init
        ipcRenderer.send('load-playlist', '')
        //reply render playlist
        ipcRenderer.on('load-playlist-reply', (event, arg) => {
            app.media = arg.timeline.slideshow.media;
            app.logo = arg.timeline.logo
            app.start();
            app.screen = arg.screen;
            app.socket.emit('screen', arg.screen.name);
        })
    },
    view: {
        renderLogo: () => {
            console.log(`Render Logo`)
            let $logo = $('<div id="logo" class="logo"></div>').css('backgroundImage', `url(${app.logo})`)
            if (!$(`#logo`).length > 0) $(app.el.$logoContainer).append($logo);
        }
    },
    slide: {
        start: () => {
            app.slide.next(0)
        },
        get: (slideIndex) => {
            return app.media[slideIndex]
        },
        createImage: (slideIndex) => {
            //check if slide
            if (app.media.length - 1 < slideIndex) return;
            //get slide data
            let thisSlide = app.slide.get(slideIndex)
            //slide-container

            let $slider = $('<div class="slide"></div>')
                .attr('data-slideindex', slideIndex)
                .attr('data-type', "image")
                .data('slideData', thisSlide)
                .css('backgroundImage', `url('${app.slide.get(slideIndex).url}')`)
            // .html(`

            //     <h1 class="header header-${thisSlide.pos}">${thisSlide.name}</h1>

            // `)

            return $slider
        },
        createVideo: (slideIndex) => {
            //check if slide
            if (app.media.length - 1 < slideIndex) return;
            //get slide data
            let thisSlide = app.slide.get(slideIndex)
            //slide-container

            let $slider = $(`
                    <div data-type="video" class="slide">
                        <video nocontrols preload>
                            <source src="${thisSlide.url}" type="video/mp4">
                        </video>
                    </div>`
                )
                .attr('data-slideindex', slideIndex)
                .data('slideData', thisSlide)


            return $slider
        },
        tickNextSlide: (slideIndex, secondsOffset) => {
            setTimeout(() => {
                if (slideIndex >= app.media.length) slideIndex = 0;
                //if type is video start video
                if($(`.slide[data-slideindex="${slideIndex}"]`).data('type') == 'video'){
                    $(`.slide[data-slideindex="${slideIndex}"] > video`).get(0).play();
                }
                // console.log(`slideinx ${slideIndex}`, `app.media ${app.media.length}`)
                app.slide.next(slideIndex)
            }, secondsOffset * 1000);
        },
        render: (slideIndex) => {
            //check if slider is already present
            if ($(`[data-slideindex="${slideIndex}"]`).length > 0) return;
            let thisSlide = app.slide.get(slideIndex)

            if(!thisSlide) return;

            switch (thisSlide.mediatype) {
                case 'image':
                    $(app.el.$slideContainer).append(app.slide.createImage(slideIndex))
                    break;
                case 'video':
                    $(app.el.$slideContainer).append(app.slide.createVideo(slideIndex))
                    break;
                default:
                    console.log('Sorry, we are out of ' + thisSlide.mediatype + '.');
            }
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