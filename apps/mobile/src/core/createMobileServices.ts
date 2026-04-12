import {
  MockKnowledgeAdapter,
  MockMobileChatAdapter,
  MockMobileHomeAdapter,
  MockTodayAdapter,
} from "@gynecology-chatbot/app-core";
import type {
  AuthPort,
  KnowledgePort,
  MobileChatPort,
  MobileHomePort,
  MobileProfilePort,
  OnboardingPort,
  TodayPort,
} from "@gynecology-chatbot/app-core";
import { createMobileApiClient, readCurrentMobileUserId } from "../api/mobileApi";
import {
  ApiKnowledgeAdapter,
  ApiMobileAuthAdapter,
  ApiMobileChatAdapter,
  ApiMobileHomeAdapter,
  ApiMobileProfileAdapter,
  ApiOnboardingAdapter,
  ApiTodayAdapter,
} from "./adapters/apiMobilePorts";
import {
  MockAuthPortAdapter,
  MockOnboardingPortAdapter,
} from "./adapters/mockMobileAuthPorts";
import {
  readMockMobileProfile,
  readMockMobileRuntime,
  updateMockMobileProfile,
} from "./mockMobileRuntime";

export interface MobileServices {
  authPort: AuthPort;
  onboardingPort: OnboardingPort;
  homePort: MobileHomePort;
  todayPort: TodayPort;
  chatPort: MobileChatPort;
  knowledgePort: KnowledgePort;
  profilePort: MobileProfilePort;
}

export interface CreateMobileServicesOptions {
  provider?: "mock" | "api";
  getUserId?: () => string;
}

class RuntimeAwareMockMobileHomeAdapter implements MobileHomePort {
  private readonly delegate = new MockMobileHomeAdapter();

  async getHomeView() {
    const base = await this.delegate.getHomeView();
    const runtime = readMockMobileRuntime();

    return {
      ...base,
      userName: runtime.currentUser?.displayName ?? base.userName,
      pregnancyWeekLabel: runtime.pregnancyWeekLabel,
      pregnancyDayCount: runtime.pregnancyDayCount,
    };
  }

  async getRecordDay(isoDate: string) {
    return this.delegate.getRecordDay(isoDate);
  }
}

export function createMobileServices(
  options: CreateMobileServicesOptions = {},
): MobileServices {
  const configuredProvider =
    options.provider ??
    (process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER as
      | "mock"
      | "api"
      | undefined) ??
    "api";
  const provider = configuredProvider;
  const resolveUserId = () => {
    const userId = options.getUserId?.();
    if (userId) {
      return userId;
    }

    const mobileUserId = readCurrentMobileUserId();
    if (mobileUserId) {
      return mobileUserId;
    }

    const runtimeUserId = readMockMobileRuntime().currentUser?.id;
    if (runtimeUserId) {
      return runtimeUserId;
    }

    return process.env.EXPO_PUBLIC_DEV_USER_ID ?? "local-user-demo";
  };

  if (provider === "api") {
    const client = createMobileApiClient({
      getUserId: resolveUserId,
    });

    return {
      authPort: new ApiMobileAuthAdapter(client),
      onboardingPort: new ApiOnboardingAdapter(client, resolveUserId),
      homePort: new ApiMobileHomeAdapter(client),
      todayPort: new ApiTodayAdapter(client),
      chatPort: new ApiMobileChatAdapter(client),
      knowledgePort: new ApiKnowledgeAdapter(client),
      profilePort: new ApiMobileProfileAdapter(client),
    };
  }

  const chatPort = new MockMobileChatAdapter();
  const knowledgePort = new MockKnowledgeAdapter();
  const todayPort = new MockTodayAdapter();

  return {
    authPort: new MockAuthPortAdapter(),
    onboardingPort: new MockOnboardingPortAdapter(),
    homePort: new RuntimeAwareMockMobileHomeAdapter(),
    todayPort,
    chatPort,
    knowledgePort,
    profilePort: {
      async getProfile() {
        return readMockMobileProfile();
      },
      async getBranding() {
        return {
          surveyFormUrl: null,
        };
      },
      async updateProfile(input) {
        return updateMockMobileProfile(input);
      },
      async submitSurveyAnswer() {
        return undefined;
      },
    },
  };
}
