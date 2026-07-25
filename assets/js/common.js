// aHR0cHM6Ly9naXRodWIuY29tL2x1b3N0MjYvYWNhZGVtaWMtaG9tZXBhZ2U=
$(function () {
    lazyLoadOptions = {
        scrollDirection: 'vertical',
        effect: 'fadeIn',
        effectTime: 300,
        placeholder: "",
        onError: function(element) {
            console.log('[lazyload] Error loading ' + element.data('src'));
        },
        afterLoad: function(element) {
            if (element.is('img')) {
                // remove background-image style
                element.css('background-image', 'none');
                element.css('min-height', '0');
            } else if (element.is('div')) {
                // set the style to background-size: cover; 
                element.css('background-size', 'cover');
                element.css('background-position', 'center');
            }
        }
    }

    $('img.lazy, div.lazy:not(.always-load)').Lazy({visibleOnly: true, ...lazyLoadOptions});
    $('div.lazy.always-load').Lazy({visibleOnly: false, ...lazyLoadOptions});

    $('[data-toggle="tooltip"]').tooltip()

    var $profilePortraits = $('.profile-portrait-toggle');
    if ($profilePortraits.length) {
        var portraitSources = String($profilePortraits.first().data('profile-portraits') || '')
            .split('|')
            .map(function (src) {
                return src.trim();
            })
            .filter(Boolean);

        var normalizeSrc = function (src) {
            var anchor = document.createElement('a');
            anchor.href = src || '';
            return anchor.href;
        };

        var normalizedPortraitSources = portraitSources.map(normalizeSrc);

        portraitSources.forEach(function (src) {
            var image = new Image();
            image.src = src;
        });

        var activePortraitIndex = normalizedPortraitSources.indexOf(normalizeSrc($profilePortraits.first().attr('src')));
        if (activePortraitIndex < 0) {
            activePortraitIndex = 0;
        }

        var isSwitchingProfilePortrait = false;

        var switchProfilePortrait = function () {
            if (isSwitchingProfilePortrait || portraitSources.length < 2) {
                return;
            }

            isSwitchingProfilePortrait = true;
            activePortraitIndex = (activePortraitIndex + 1) % portraitSources.length;
            var nextSrc = portraitSources[activePortraitIndex];
            var normalizedNextSrc = normalizedPortraitSources[activePortraitIndex];

            $profilePortraits.addClass('is-switching');

            window.setTimeout(function () {
                var pending = $profilePortraits.length;

                var finish = function () {
                    pending -= 1;
                    if (pending <= 0) {
                        $profilePortraits.removeClass('is-switching');
                        isSwitchingProfilePortrait = false;
                    }
                };

                $profilePortraits.each(function () {
                    if (normalizeSrc($(this).attr('src')) === normalizedNextSrc) {
                        finish();
                        return;
                    }

                    $(this).one('load error', finish);
                    this.src = nextSrc;
                });

                window.setTimeout(function () {
                    $profilePortraits.removeClass('is-switching');
                    isSwitchingProfilePortrait = false;
                }, 700);
            }, 180);
        };

        $profilePortraits.on('click', switchProfilePortrait);
        $profilePortraits.on('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                switchProfilePortrait();
            }
        });
    }

    var $grid = $('.grid').masonry({
        "percentPosition": true,
        "itemSelector": ".grid-item",
        "columnWidth": ".grid-sizer"
    });
    // layout Masonry after each image loads
    $grid.imagesLoaded().progress(function () {
        $grid.masonry('layout');
    });

    $(".lazy").on("load", function () {
        $grid.masonry('layout');
    });
})
