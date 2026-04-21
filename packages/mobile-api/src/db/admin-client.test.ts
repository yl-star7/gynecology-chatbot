jest.mock("../local-postgres", () => ({
  localSupabaseDelete: jest.fn(),
  localSupabaseInsert: jest.fn(),
  localSupabaseRpc: jest.fn(),
  localSupabaseSelect: jest.fn(),
  localSupabaseUpdate: jest.fn(),
}));

jest.mock("../server-data-provider", () => ({
  hasDockerConfig: jest.fn(() => true),
}));

import {
  localSupabaseInsert,
  localSupabaseSelect,
  localSupabaseUpdate,
} from "../local-postgres";
import { dbInsert, dbSelect, dbUpdate } from "./admin-client";

const mockedLocalSelect = jest.mocked(localSupabaseSelect);
const mockedLocalInsert = jest.mocked(localSupabaseInsert);
const mockedLocalUpdate = jest.mocked(localSupabaseUpdate);

describe("db admin client helpers", () => {
  beforeEach(() => {
    mockedLocalSelect.mockReset();
    mockedLocalInsert.mockReset();
    mockedLocalUpdate.mockReset();
    mockedLocalSelect.mockResolvedValue([]);
    mockedLocalInsert.mockResolvedValue([]);
    mockedLocalUpdate.mockResolvedValue([]);
  });

  it("routes content schema reads through public mirror tables", async () => {
    await dbSelect(
      "content.week_questions?select=id&question_id=in.(q1,q2)&order=day_number.asc.nullslast,display_order.desc.nullsfirst&limit=1",
    );

    expect(mockedLocalSelect).toHaveBeenCalledWith(
      "content_week_questions?select=id&question_id=in.(q1,q2)&order=day_number.asc.nullslast,display_order.desc.nullsfirst&limit=1",
    );
  });

  it("remaps published week reads to Cloud SQL public tables", async () => {
    await dbSelect(
      "published_weeks?select=week_number&week_number=eq.5&limit=1",
    );

    expect(mockedLocalSelect).toHaveBeenCalledWith(
      "content_pregnancy_week_data?select=week_number&week_number=eq.5&limit=1&status=eq.published",
    );
  });

  it("delegates writes to the Cloud SQL helper layer", async () => {
    await dbInsert("content.week_questions", { id: "question-1" });
    await dbUpdate("content.week_questions?id=eq.question-1", {
      is_active: false,
    });

    expect(mockedLocalInsert).toHaveBeenCalledWith(
      "content_week_questions",
      { id: "question-1" },
    );
    expect(mockedLocalUpdate).toHaveBeenCalledWith(
      "content_week_questions?id=eq.question-1",
      { is_active: false },
    );
  });
});
