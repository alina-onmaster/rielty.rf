"use strict";

var gulp = require('gulp'),
  gp = require('gulp-load-plugins')(),
  fs = require('fs'),
  autoprefixer = require('autoprefixer'),
  include = require('posthtml-include'),
  htmlreplace = require('gulp-html-replace'),
  tinypng = require('gulp-tinypng-extended'),
  // Если нужен, подключаем SSH, отключен по умолчанию, чтобы не вызывал ошибок
  // GulpSSH = require('gulp-ssh'),
  // config = require('./gulp-config-dev1.json'),
  // gulpSSH = new GulpSSH({
  //     ignoreErrors: false,
  //     sshConfig: {
  //         host: config.ssh.host,
  //         port: config.ssh.port,
  //         username: config.ssh.username,
  //         password: config.ssh.password
  //     }
  // }),
  server = require('browser-sync').create(),
  // Массив для списка папок блоков, заполнится сам чуть ниже по коду
  blocks = [],
  // Базовые пути отдельно, чтобы можно было использовать для других путей
  modules = [],
  // Базовые пути отдельно, чтобы можно было использовать для других путей
  basePath = {
    src: 'source',
    dev: 'dev',
    prod: 'prod',
    less: 'source/less',
    lessBlocks: 'source/less/blocks', // Путь до папки с блоками препроцессорных файлов, например source/less/blocks
    srcCms: '', // Название папки в которой размещаются исходники для CMS, например, source-cms
    templatesFolder: '', // Название папки в которой размещаются шаблоны, например, custom
    modulesFolder: '', // Название папки в которой размещаются модули CMS, например, modules
    templateName: '', // Должно определиться само из названия папки в исходниках
    title: 'Ваши окна', // Название сайта
    protocol: 'https://',
    domain: '' // URL сайта, без протокола
  },
  path = {
    // Пути до исходников
    src: {
      html: basePath.src + '/*.html',
      htmlWatch:
        [basePath.src + '/*.html'
          // Сюда добавим пути к файлам блоков чуть ниже по коду
        ],
      lessAll: basePath.less + '/style.less',
      // Чтобы вотчер не тормозил прописываем каждую папку отдельно
      lessWatch:
        [basePath.less + '/*.less'
          // Сюда добавим пути к файлам блоков чуть ниже по коду
        ],
      modulesWatch:
        [
          // Сюда добавим пути к файлам модулей чуть ниже по коду
        ],
      cssAll: 'dev/css/style.css',
      cssLib: basePath.src + '/css-lib',
      js: basePath.src + '/js',
      jsLib: basePath.src + '/js-lib',
      jsWatch: basePath.src + '/js/**/*.js',
      imgOriginal: basePath.src + '/img-original',
      img: basePath.src + '/img',
      imgOpt: basePath.src + '/img-optimized', // Оптимизированные изображения (jpg,jpeg,png}
      fonts: basePath.src + '/fonts',
      svg: ['source/img-original/**/*.svg', 'source/less/blocks/**/*.svg', '!source/**/icon-*.svg', '!source/**/sprite.svg']
    },
    // Пути к папкам разработки
    dev: {
      root: basePath.dev,
      css: basePath.dev + '/css',
      img: basePath.dev + '/img',
      js: basePath.dev + '/js',
      fonts: basePath.dev + '/fonts',
    },
    // Пути к папкам продакшена
    prod: {
      root: basePath.prod,
      css: basePath.prod + '/css',
      img: basePath.prod + '/img',
      js: basePath.prod + '/js',
      fonts: basePath.prod + '/fonts',
    },
    remote: {
      srv: '', // URL удалённого сервера для разработки
      dest: '' // путь до папки с сайтом на удалённом сервере для разработки /var/www/USERNAME/data/www/DOMAIN
    }
  };

// Получаем список блоков и записываем их в массив blocs
if (basePath.lessBlocks) {
  fs.readdirSync(basePath.lessBlocks).forEach(function (directory) {
    blocks.push(directory);
  });
}

// Получаем название папки шаблона CMS и создаём итоговой путь до папки готового шаблона
// Если нужно иное, закомментировать и вписать выше вручную
if (basePath.srcCms) {
  fs.readdirSync(basePath.srcCms).forEach(function (directory) {
    var templateName = directory;
    basePath.templateName = templateName;
  });

  // Получаем список модулей и записываем их в массив modules
  if (basePath.templateName) {
    fs.readdirSync(basePath.srcCms + '/' + basePath.templateName + '/' + basePath.modulesFolder).forEach(function (directory) {
      modules.push(directory);
    });

    // Добавляем к path.src.modulesWatch пути к блокам
    modules.forEach (function (module) {
      path.src.modulesWatch.push(basePath.srcCms + '/' + basePath.templateName + '/' + basePath.modulesFolder + '/' + module + '/*.php');
      path.src.modulesWatch.push(basePath.srcCms + '/' + basePath.templateName + '/' + basePath.modulesFolder + '/' + module + '/views/*.php');
    });
  }
}

// Добавляем к path.src.lessWatch пути к блокам
blocks.forEach (function (block) {
  path.src.lessWatch.push(basePath.less + '/blocks/' + block + '/*.less');
});

// Добавляем к path.src.htmlWatch пути к блокам
blocks.forEach (function (block) {
  path.src.htmlWatch.push(basePath.less + '/blocks/' + block + '/*.html');
});

// Делаем из уже собранного less css и складываем в папку для разработки
gulp.task('style', function () {
  return gulp.src(path.src.lessAll)
    .pipe(gp.plumber())
    .pipe(gp.less())
    .pipe(gp.postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest(path.dev.css))
    .pipe(server.stream());
});

// Делаем из уже собранного less css и складываем в папку для продакшена
gulp.task('style-prod', function () {
  return gulp.src(path.src.lessAll)
    .pipe(gp.plumber())
    .pipe(gp.less())
    .pipe(gp.postcss([
      autoprefixer()
    ]))
    //.pipe(gp.csso()) //Минимизируем css для продакшена, если не нужно, закомментировать
    .pipe(gulp.dest(path.prod.css));
});

// Делаем из уже собранного less css и складываем в папку шаблона
if (basePath.templateName) {
  gulp.task('style-custom', function () {
    return gulp.src(path.src.lessAll)
      .pipe(gp.plumber())
      .pipe(gp.less())
      .pipe(gp.postcss([
        autoprefixer()
      ]))
      //.pipe(gp.csso()) //Минимизируем css для продакшена, если не нужно, закомментировать
      .pipe(rename(`style_${Date.now()}.tmpcss`))
      .pipe(gulp.dest(basePath.templatesFolder + '/' + basePath.templateName + '/css/'));
  });
}

// Минимизируем JS для разработки
gulp.task('js', function () {
  // returns a Node.js stream, but no handling of error messages
  return gulp.src([path.src.js + '/**/*.js', '!' + path.js + '/**/*.min.js'])
    .pipe(gp.plumber())
    // .pipe(gp.uglify())
    .pipe(gulp.dest(path.dev.js + '/'));
});

// Минимизируем JS для шаблона
if (basePath.templateName) {
  gulp.task('js-custom', function () {
    return gulp.src([path.src.js + '/**/*.js', '!' + path.js + '/**/*.min.js'])
      .pipe(gp.plumber())
      // .pipe(gp.uglify())
      .pipe(gulp.dest(basePath.templatesFolder + '/' + basePath.templateName + '/js/'));
  });
}

// Минимизируем JS для продакшена
gulp.task('js-prod', function () {
  return gulp.src([path.src.js + '/**/*.js', '!' + path.js + '/**/*.min.js'])
    .pipe(gp.plumber())
    // .pipe(gp.uglify())
    .pipe(gulp.dest(path.prod.js + '/'));
});

// Оптимизируем все svg и складываем в папку для разработки.
gulp.task('svg', function () {
  return gulp.src(path.src.svg)
    // .pipe(gp.newer('./source/img'))
    .pipe(gp.imagemin([
      gp.imagemin.svgo({
        plugins: [
          {removeUselessStrokeAndFill: true}
        ]
      })
    ]))
    .pipe(gulp.dest(path.dev.img));
});

// Оптимизируем все svg и складываем в папку для продакшена
gulp.task('svg-prod', function () {
  return gulp.src(path.src.svg)
    .pipe(gp.imagemin([
      gp.imagemin.svgo({
        plugins: [
          {removeUselessStrokeAndFill: true}
        ]
      })
    ]))
    .pipe(gulp.dest(path.prod.img));
});

// Оптимизируем jpg и png с помощью стороннего сервиса tinypng.com (бесплатно 500 файлов в месяц)
// Складываем в папку для оптимизированных изображений для последующей отправки в git
// В будущем хотелось бы перенести эту функцию в CI, но для этого понадобится какой-то кэширующий сервер,
// иначе лимит в 500 файлов будет улетать довольно быстро.
gulp.task('tiny', function() {
  return gulp.src([path.dev.img + '/**/*.{jpg,jpeg,png}', path.src.imgOriginal + '/**/*.{jpg,jpeg,png}'])
    .pipe(gp.plumber())
    .pipe(tinypng({
      key: 'jO4jokCHdaoyAiRSqQifbkbQzjh9LaQD',
      sigFile: path.src.imgOpt + '/.tinypng-sigs',
      log: true
    }))
    .pipe(gulp.dest(path.src.imgOpt));
});

// Нарезаем изображения для используемых блоков для разработки
gulp.task('responsive', function (done) {
  // Make configuration from existing HTML and CSS files
  blocks.forEach (function (block) {
    var config = gp.responsiveConfig([
      basePath.lessBlocks + '/' + block + '/*.less',
      basePath.lessBlocks + '/' + block + '/*.html'
    ]);
    return gulp.src(basePath.lessBlocks + '/' + block + '/*.{jpg,jpeg,png}')
      // Use configuration
      .pipe(gp.plumber())
      .pipe(gp.responsive(config, {
        errorOnEnlargement: false,
        // normalize: true,
        quality: 100,
        compressionLevel: 0,
      }))
      .pipe(gp.imagemin([
        gp.imagemin.jpegtran({progressive: true})
      ]))
      .pipe(gulp.dest(path.dev.img + '/' + block + '/'))
      .pipe(gp.webp({quality: 80}))
      .pipe(gulp.dest(path.dev.img + '/' + block + '/'))
  });
  done();
});

gulp.task('responsive-prod', function (done) {
  // Make configuration from existing HTML and CSS files
  blocks.forEach (function (block) {
    var config = gp.responsiveConfig([
      basePath.lessBlocks + '/' + block + '/*.less',
      basePath.lessBlocks + '/' + block + '/*.html'
    ]);
    return gulp.src(basePath.lessBlocks + '/' + block + '/*.{jpg,jpeg,png}')
      // Use configuration
      .pipe(gp.plumber())
      .pipe(gp.responsive(config, {
        errorOnEnlargement: false,
        // normalize: true,
        quality: 100,
        compressionLevel: 0,
      }))
      .pipe(gp.imagemin([
        gp.imagemin.jpegtran({progressive: true})
      ]))
      .pipe(gp.webp({quality: 80}))
      .pipe(gulp.dest(path.prod.img + '/' + block + '/'));
  });
  done();
});

// Делаем webp для изображений не требующих нарезку, лучше так не делать!
// gulp.task('webp', function () {
//     return gulp.src([path.src.imgOriginal + '/**/*.{jpg,jpeg,png}', '!**/favicons/*.png'])
//     // .pipe(gp.newer('./dev/img'))
//         .pipe(gp.webp({quality: 80}))
//         .pipe(gulp.dest(path.dev.img));
// });

// Подготавливаем спрайт для последующей вставки в HTML
gulp.task('sprite', function () {
    return gulp.src(basePath.src + '/**/icon-*.svg')
      /*            .pipe(gp.cheerio({
                      run: function ($) {
                          $('[fill]').removeAttr('fill');
                      },
                      parserOptions: { xmlMode: true }
                  }))*/
      .pipe(gp.svgstore({
        inlineSvg: true
      }))
      .pipe(gp.rename('sprite.svg'))
      .pipe(gulp.dest(path.src.img));
  }
);

// Вставляем в HTML ранее подготовленный спрайт для разработки
gulp.task('html', function () {
    return gulp.src(path.src.html)
      .pipe(gp.posthtml([
        include()
      ]))
      .pipe(gulp.dest(path.dev.root + '/'));
  }
);

// Вставляем в HTML ранее подготовленный спрайт для продакшена
gulp.task('html-prod', function () {
    return gulp.src(path.src.html)
      .pipe(gp.posthtml([
        include()
      ]))
      .pipe(gulp.dest(path.prod.root + '/'));
  }
);

// Копирование JS и CSS-библиотек папку для разработки
gulp.task('copy-css-lib-to-dev', function () {
    return gulp.src(path.src.cssLib + '/**/*.css')
      // .pipe(gp.newer('./dev/js/'))
      .pipe(gulp.dest(path.dev.css + '/'));
  }
);

gulp.task('copy-js-lib-to-dev', function () {
    return gulp.src(path.src.jsLib + '/**/*.js')
      // .pipe(gp.newer('./dev/js/'))
      .pipe(gulp.dest(path.dev.js + '/'));
  }
);

// Копирование JS и CSS-библиотек папку для разработки
gulp.task('copy-css-lib-to-prod', function () {
    return gulp.src(path.src.cssLib + '/**/*.css')
      .pipe(gulp.dest(path.prod.css + '/'));
  }
);

gulp.task('copy-js-lib-to-prod', function () {
    return gulp.src(path.src.jsLib + '/**/*.js')
      .pipe(gulp.dest(path.prod.js + '/'));
  }
);

// Копируем оптимизированные шрифты в папку для разработки
gulp.task('copy-fonts-to-dev', function () {
    return gulp.src(path.src.fonts + '/*.{woff,woff2}')
      .pipe(gulp.dest(path.dev.fonts));
  }
);

// Копируем шрифты из папки для разработки в папку продакшена
gulp.task('copy-fonts-to-prod', function () {
    return gulp.src(path.src.fonts + '/*.{woff,woff2}')
      .pipe(gulp.dest(path.prod.fonts + '/'));
  }
);

// Копируем оптимизированные изображения в папку продакшена
gulp.task('copy-img-to-prod', function () {
    return gulp.src([path.src.img + '/**/*.{svg,webp,webmanifest,ico,xml}', path.src.imgOpt + '/**/*.{jpg,jpeg,png}', '!source/**/icon-*.svg', '!source/**/sprite.svg'])
      .pipe(gulp.dest(path.prod.img + '/'));
  }
);

// Если вёрстка предназначена для шаблона копируем PHP из папки исходников шаблона в соответствующую папку шаблона
if (basePath.srcCms && basePath.templateName) {
  gulp.task('copy-php-to-custom', function () {
      return gulp.src(basePath.srcCms + '/' + basePath.templateName + '/**/*.php')
        .pipe(gulp.dest(basePath.templatesFolder + '/' + basePath.templateName + '/'));
    }
  );
}

// Если вёрстка предназначена для шаблона кучно копируем всё, кроме HTML, из папки продакшена в соответствующую папку шаблона
if (basePath.templateName) {
  gulp.task('copy-prod-to-custom', function () {
      return gulp.src([path.prod.root + '/**/*', '!' + path.prod.root + '/**/*.html', '!' + path.prod.root + '/**/style.css'])
        .pipe(gulp.dest(basePath.templatesFolder + '/' + basePath.templateName + '/'));
    }
  );
}

// Live-сервер для разработки
gulp.task('srv', function () {
  server.init({
    server: path.dev.root + '/',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch(path.dev.root + '/*.html').on('change', server.reload);
  gulp.watch(path.dev.css + '/*.css').on('change', server.reload);
  gulp.watch(path.dev.js + '/*.js').on('change', server.reload);
});

// Live-сервер для локальной проверки сборки продакшена
gulp.task('srv-prod', function () {
  server.init({
    server: path.prod.root + '/',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });
});

//Не так быстро как хотелось бы, но можно проксировать через локальный Live-сервер даже сайт с удалённого сервера и получать Live Reload
if (basePath.srcCms && basePath.templateName) {
  gulp.task('srv-remote', function () {
    server.init({
      proxy: path.remote.srv
    });

    server.watch(basePath.srcCms + '/' + basePath.templateName + '/css/*.css').on('change', gulp.series('sftp-css', server.reload));
    server.watch(basePath.srcCms + '/' + basePath.templateName + '/themes/*.php').on('change', gulp.series('sftp-php', server.reload));
    server.watch(basePath.srcCms + '/' + basePath.templateName + '/themes/blocks/*.php').on('change', gulp.series('sftp-php', server.reload));
    server.watch(basePath.srcCms + '/' + basePath.templateName + '/modules/feedback/views/*.php').on('change', gulp.series('sftp-php', server.reload));
  });
}

//Если отладка происходит на удалённом сервере, то можно автоматизировать отправку туда файлов по ssh
gulp.task('sftp-css', function () {
  return gulp.src(path.custom.root + '/**/*.css')
    .pipe(gulpSSH.dest(path.remote.dest + '/' + path.custom.root + '/'));
});

gulp.task('sftp-php', function () {
  return gulp.src(path.custom.root + '/**/*.php')
    .pipe(gulpSSH.dest(path.remote.dest + '/' + path.custom.root + '/'));
});

gulp.task('sftp-js', function () {
  return gulp.src(path.custom.root + '/**/*.js')
    .pipe(gulpSSH.dest(path.remote.dest + '/' + path.custom.root + '/'));
});

gulp.task('sftp-img', function () {
  return gulp.src(path.custom.root + '/**/*.{jpg,jpeg,png,svg}')
    .pipe(gulpSSH.dest(path.remote.dest + '/' + path.custom.root + '/'));
});

gulp.task('sftp-full', function () {
  return gulp.src(path.custom.root + '/**/*')
    .pipe(gulpSSH.dest(path.remote.dest + '/' + path.custom.root + '/'));
});


// Смотрим за изменениями в исходниках при разработке
gulp.task('watch', function () {
  gulp.watch(path.src.lessWatch, gulp.series('style'));
  gulp.watch(path.src.jsWatch, gulp.series('js'));
  gulp.watch(path.src.htmlWatch, gulp.series('html'));
});

// !!! Тёмный лес !!! Нужно дорабатывать! Если кто-то дойдёт до этого момента, свяжитесь с кто это писал
// Смотрим за изменениями в исходниках при разработке для шаблона с отладкой на удалённом сервере
if (basePath.srcCms && basePath.templateName) {
  gulp.task('watch-cms', function () {
    gulp.watch(path.src.lessWatch, gulp.series('style', 'style-custom'));

    gulp.watch(path.src.jsWatch, gulp.series('js-custom'));

    gulp.watch([basePath.srcCms + '/' + basePath.templateName + '/themes/*.php',
        basePath.srcCms + '/' + basePath.templateName + '/themes/blocks/*.php',
        basePath.srcCms + '/' + basePath.templateName + '/themes/functions/*.php',
        path.src.modulesWatch],
      gulp.series('copy-php-to-custom'));
  });
}

//Делаем favicon realfavicongenerator.net
// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'faviconData.json';

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the check-for-favicon-update task below).
if (basePath.templateName) {
  gulp.task('favicon', function(done) {
    gp.realFavicon.generateFavicon({
      masterPicture: 'source/img-original/favicon.svg',
      dest: path.src.img + '/favicons/',
      iconsPath: basePath.protocol + basePath.domain + '/' + basePath.src + '/' + basePath.templateName + '/img/favicons/',
      design: {
        ios: {
          pictureAspect: 'noChange',
          assets: {
            ios6AndPriorIcons: true,
            ios7AndLaterIcons: true,
            precomposedIcons: false,
            declareOnlyDefaultIcon: true
          },
          appName: basePath.title, //Из этого формируется short_name в site.webmanifest и по рекомендациям Google длинна должна быть <12 символов
        },
        desktopBrowser: {},
        windows: {
          pictureAspect: 'noChange',
          backgroundColor: '#820f0f',
          onConflict: 'override',
          assets: {
            windows80Ie10Tile: false,
            windows10Ie11EdgeTiles: {
              small: true,
              medium: true,
              big: true,
              rectangle: false
            }
          },
          appName: basePath.title,
        },
        androidChrome: {
          pictureAspect: 'shadow',
          themeColor: '#820f0f',
          manifest: {
            name: basePath.title, //Из этого формируется short_name в site.webmanifest и по рекомендациям Гугла длинна должна быть <12 символов
            startUrl: basePath.protocol + basePath.domain,
            display: 'standalone',
            orientation: 'notSet',
            onConflict: 'override',
            declared: true
          },
          assets: {
            legacyIcon: false,
            lowResolutionIcons: false
          }
        },
        safariPinnedTab: {
          pictureAspect: 'blackAndWhite',
          threshold: 57.03125,
          themeColor: '#820f0f'
        }
      },
      settings: {
        scalingAlgorithm: 'Mitchell',
        errorOnImageTooSmall: false,
        readmeFile: false,
        htmlCodeFile: false,
        usePathAsIs: false
      },
      markupFile: FAVICON_DATA_FILE
    }, function() {
      done();
    });
  });

// Inject the favicon markups in your HTML pages. You should run
// this task whenever you modify a page. You can keep this task
// as is or refactor your existing HTML pipeline.
  gulp.task('favicon-in-html', function() {
    return gulp.src([ basePath.src + '/*.html'])
      .pipe(gp.realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
      .pipe(gulp.dest(basePath.src + '/'));
  });

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
  gulp.task('check-for-favicon-update', function(done) {
    var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
    gp.realFavicon.checkForUpdates(currentVersion, function(err) {
      if (err) {
        throw err;
      }
    });
  });
}

// Запукаем gulp go при локальной разработке,
// запуская слежение за изменениями файлов исходников и Live Reload локального сервера
gulp.task('go', gulp.series('html', 'style', gulp.parallel('srv', 'watch')));

// Запукаем gulp go-cms при разработки шаблона и его отладки на удалённом сервере,
// запуская слежение за изменениями файлов исходников и Live Reload проксируеший удалённый сайт через локального сервера
if (basePath.srcCms) {
  gulp.task('go-cms', gulp.series('style', gulp.parallel('watch-cms')));
}

// Сборка с нуля из исходников проекта для разработки
gulp.task('dev', gulp.series('sprite', 'html', 'style', 'responsive', 'svg', 'js', 'copy-fonts-to-dev', 'copy-css-lib-to-dev', 'copy-js-lib-to-dev'));

// CI Сборка с нуля из исходников и оптимизированных изображений продакшен версии
gulp.task('prod', gulp.series('sprite', 'html-prod', 'style-prod', 'responsive-prod', 'svg-prod', 'js-prod', 'copy-img-to-prod', 'copy-fonts-to-prod', 'copy-css-lib-to-prod', 'copy-js-lib-to-prod'));

//Сборка из продакшен версии шаблона
if (basePath.srcCms) {
  gulp.task('prod-cms', gulp.series('copy-prod-to-custom', 'style-custom', 'copy-php-to-custom'));
}
