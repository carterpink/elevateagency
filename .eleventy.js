module.exports = function (eleventyConfig) {
  // Static assets + CMS admin are copied through untouched
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");

  // JSON helper for embedding data into pages (roster modal/filter)
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));

  // Plain text -> HTML line breaks (lets editors write multi-line headlines)
  eleventyConfig.addFilter("nl2br", (str) =>
    (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")
  );

  // Take the first n items of an array
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  // Roster collection, ordered by the `order` field then name
  eleventyConfig.addCollection("djs", (collectionApi) =>
    collectionApi
      .getFilteredByTag("dj")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
