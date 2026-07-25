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

        var getProfilePortraitImage = function ($portrait) {
            if ($portrait.is('img')) {
                return $portrait;
            }

            return $portrait.find('.profile-portrait-image').first();
        };

        var getProfilePortraitNextImage = function ($portrait) {
            if ($portrait.is('img')) {
                return $();
            }

            return $portrait.find('.profile-portrait-next-image').first();
        };

        var updateProfilePortraitStack = function ($portrait, activeIndex) {
            if ($portrait.is('img')) {
                return;
            }

            $portrait.find('.profile-portrait-underlay-middle').attr('src', portraitSources[(activeIndex + 1) % portraitSources.length]);
        };

        var normalizedPortraitSources = portraitSources.map(normalizeSrc);

        portraitSources.forEach(function (src) {
            var image = new Image();
            image.src = src;
        });

        var activePortraitIndex = normalizedPortraitSources.indexOf(normalizeSrc(getProfilePortraitImage($profilePortraits.first()).attr('src')));
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

            var pending = $profilePortraits.length;

            var startCrossfade = function () {
                pending -= 1;
                if (pending > 0) {
                    return;
                }

                $profilePortraits.addClass('is-switching');

                window.setTimeout(function () {
                    $profilePortraits.each(function () {
                        var $portrait = $(this);
                        var $portraitImage = getProfilePortraitImage($portrait);

                        $portraitImage.attr('src', nextSrc);
                        updateProfilePortraitStack($portrait, activePortraitIndex);
                    });

                    $profilePortraits.removeClass('is-switching');

                    window.setTimeout(function () {
                        $profilePortraits.each(function () {
                            var $portrait = $(this);
                            getProfilePortraitNextImage($portrait).attr('src', portraitSources[(activePortraitIndex + 1) % portraitSources.length]);
                        });

                        isSwitchingProfilePortrait = false;
                    }, 350);
                }, 350);
            };

            $profilePortraits.each(function () {
                var $portrait = $(this);
                var $portraitImage = getProfilePortraitImage($portrait);
                var $nextImage = getProfilePortraitNextImage($portrait);

                if (!$nextImage.length) {
                    $portrait.addClass('is-switching');
                    window.setTimeout(function () {
                        $portraitImage.attr('src', nextSrc);
                        $portrait.removeClass('is-switching');
                        startCrossfade();
                    }, 180);
                    return;
                }

                if (normalizeSrc($nextImage.attr('src')) === normalizedNextSrc && $nextImage[0].complete) {
                    startCrossfade();
                    return;
                }

                $nextImage.one('load error', startCrossfade);
                $nextImage.attr('src', nextSrc);
            });

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
