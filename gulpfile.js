/**
 *
 * putzfish v0.4.0
 *
 * $ gulp purge --input <goldfish-export-folder>
 *
 */

const {src, dest, series} = require('gulp');
const cssnano = require('cssnano');
const postcss = require('gulp-postcss');
const uglify = require('gulp-uglify');
const del = require('delete');
const postUncss = require('uncss').postcssPlugin;
const pipeline = require('readable-stream').pipeline;
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const imagemin = require('gulp-imagemin');

/**
 * Defaults
 * ----------------------------------------------------------
 */

let input = '';
let output = '';

/**
 * Command Line Inputs
 *
 * $ gulp putzfish --input <goldfish-export-folder>
 *
 * ----------------------------------------------------------
 */

// fetch command line arguments
const arg = (argList => {
  let arg = {},
    a,
    opt,
    thisOpt,
    curOpt;
  for (a = 0; a < argList.length; a++) {
    thisOpt = argList[a].trim();
    opt = thisOpt.replace(/^\-+/, '');

    if (opt === thisOpt) {
      // argument value
      if (curOpt) arg[curOpt] = opt;
      curOpt = null;
    } else {
      // argument name
      curOpt = opt;
      arg[curOpt] = true;
    }
  }

  return arg;
})(process.argv);

console.log('arg.input: ', arg.input);


if (arg.input || arg.input !== undefined) {
  input = arg.input;
  output = arg.input + '/../optimiert';

} else {
  input = './input';
  output = './optimiert';
}


console.log('INPUT: ', input);
console.log('OUTPUT: ', output);

/**
 * Paths
 * ----------------------------------------------------------
 */

const paths = {

  html: {
    src: [output + '/**/*.html', output + '/**/*.php'],
    dest: output + '/'
  },

  styles: {
    src: [output + '/support/**/*.css', '!' + output + '/support/**/*.min.css', '!' + output + '/support/global_style.css', '!' + output + '/support/animation.js'],
    dest: output + '/support/'
  },

  images: {
    src: [output + '/media/*',],
    dest: output + '/media'
  },

  scripts: {
    src: [output + '/support/**/*.js', '!' + output + '/support/**/*.min.js'],
    dest: output + '/support/'
  },

  uncss: {
    src: [output + '/support/global_style.css'],
    dest: output + '/support/'
  },

  dest: [output]
};

/**
 * Options
 * ----------------------------------------------------------
 */

const options = {
  autoprefixer: {
    browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
  },
  uncss: {
    html: paths.html.src,
    timeout: 500,

    // zoomOverlay7aa6a9135d596740
    ignore       : ['#overlay', '.image','#imageZoomContainer', /zoomOverlay[\w]+/],

  },
  rename: {
    suffix: '.min'
  },
  imagemin: {
    verbose: true
  }
};

/**
 * PostCSS Plugins
 * ----------------------------------------------------------
 */

const postcss_plugins_uncss = [
  postUncss(options.uncss),
  cssnano()
];

const postcss_plugins_nano = [
  cssnano()
];

/**
 * Tasks
 * ----------------------------------------------------------
 */



// Clean assets
function clean() {
  return del(paths.dest,  {force: true});
}

// Duplicate Sources
function copyToOutputFolder() {
  return pipeline(
    src(input + '/**/*'),
    dest(output));
}

// import helper File Sources
function copyHelperFileToOutputFolder() {
  return pipeline(
    src('./assets/putzfish.html'),
    dest(output));
}

// Styles
function styles() {
  // Analyse CSS and compress it
  return pipeline(
    src(paths.styles.src),
    postcss(postcss_plugins_nano),
    rename(options.rename),
    dest(paths.styles.dest)
  );
}

// Uncss global_styles
function uncss() {
  // Analyse CSS and compress it
  return pipeline(
    src(paths.uncss.src),
    postcss(postcss_plugins_uncss),
    rename(options.rename),
    dest(paths.uncss.dest)
  );
}

// Scrips
function scripts() {
  // compress JS
  return pipeline(
    src(paths.scripts.src),
    uglify(),
    rename(options.rename),
    dest(paths.scripts.dest)
  );
}


// Images
function images() {
  // Minify PNG, JPEG, GIF and SVG images
  return pipeline(
    src(paths.images.src),
    imagemin(options.imagemin),
    dest(paths.images.dest)
  );
}


// HTML
function replaceSupportinHtmlFiles() {
// replace css and js filenames in html with 'min'-versions
  return pipeline(
    src(paths.html.src),
    replace('.css', '.min.css'),
    replace('.js', '.min.js'),
    replace('.min.min.', '.min.'),
    dest(paths.html.dest)
  );
}

/**
 * Export Tasks
 * ----------------------------------------------------------
 */

exports.putzfish = series(
  clean,
  copyToOutputFolder,
  copyHelperFileToOutputFolder,
  styles,
  uncss,
  scripts,
  replaceSupportinHtmlFiles,
  images,
);
