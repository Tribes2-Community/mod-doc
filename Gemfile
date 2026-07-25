source "https://rubygems.org"

# Matches what GitHub Pages actually runs, so a local build and the deployed
# site stay in step. `bundle exec jekyll serve` to preview.
gem "github-pages", group: :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-optional-front-matter"
  gem "jekyll-readme-index"
  gem "jekyll-relative-links"
  gem "jekyll-titles-from-headings"
  gem "jekyll-sitemap"
end

# Windows / JRuby timezone data
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1", platforms: [:mingw, :x64_mingw, :mswin]

# Ruby 3.0 removed WEBrick from the standard library, and the Jekyll 3.x that
# GitHub Pages pins still uses it for `jekyll serve`. Needed for local preview
# only — `jekyll build` and the deployed Pages build do not touch it.
gem "webrick", "~> 1.8"

# Ruby 3.4 dropped these from the default gems
gem "csv"
gem "base64"
gem "bigdecimal"
