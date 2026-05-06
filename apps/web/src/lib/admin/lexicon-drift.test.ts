import { __testing__ } from "./lexicon-drift";

const { extractBucketStats, hasWeekTag, extractSearchResults } = __testing__;

describe("lexicon-drift helpers", () => {
  describe("extractBucketStats", () => {
    it("returns file_count when a matching bucket is found", () => {
      const buckets = [
        { name: "other-bucket", file_count: 10 },
        { name: "pregnancy-knowledge", file_count: 42 },
      ];

      expect(extractBucketStats(buckets, "pregnancy-knowledge")).toEqual({
        fileCount: 42,
      });
    });

    it("falls back to document_count when file_count is absent", () => {
      const buckets = [
        { bucket_name: "pregnancy-knowledge", document_count: 7 },
      ];

      expect(extractBucketStats(buckets, "pregnancy-knowledge")).toEqual({
        fileCount: 7,
      });
    });

    it("returns null when the bucket list is not an array", () => {
      expect(extractBucketStats(null, "pregnancy-knowledge")).toBeNull();
      expect(extractBucketStats({}, "pregnancy-knowledge")).toBeNull();
    });

    it("returns null when the bucket is missing", () => {
      const buckets = [{ name: "other", file_count: 3 }];
      expect(extractBucketStats(buckets, "pregnancy-knowledge")).toBeNull();
    });
  });

  describe("hasWeekTag", () => {
    it("detects numeric week values", () => {
      expect(hasWeekTag({ metadata: { week: 12 } })).toBe(true);
    });

    it("detects non-empty string week values", () => {
      expect(hasWeekTag({ metadata: { week: "12" } })).toBe(true);
    });

    it("returns false for empty strings, missing fields, and null metadata", () => {
      expect(hasWeekTag({ metadata: { week: "" } })).toBe(false);
      expect(hasWeekTag({ metadata: { week: null } })).toBe(false);
      expect(hasWeekTag({ metadata: {} })).toBe(false);
      expect(hasWeekTag({})).toBe(false);
    });

    it("reads from payload when metadata is absent", () => {
      expect(hasWeekTag({ payload: { week: 7 } })).toBe(true);
    });
  });

  describe("extractSearchResults", () => {
    it("reads from results, matches, or hits arrays", () => {
      expect(
        extractSearchResults({ results: [{ metadata: { week: 1 } }] }),
      ).toHaveLength(1);
      expect(
        extractSearchResults({ matches: [{ metadata: { week: 2 } }] }),
      ).toHaveLength(1);
      expect(
        extractSearchResults({ hits: [{ metadata: { week: 3 } }] }),
      ).toHaveLength(1);
    });

    it("returns an empty array for invalid shapes", () => {
      expect(extractSearchResults(null)).toEqual([]);
      expect(extractSearchResults("string")).toEqual([]);
      expect(extractSearchResults({})).toEqual([]);
    });
  });
});
