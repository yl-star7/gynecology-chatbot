import { MockMobileChatAdapter, MockMobileHomeAdapter } from "@gynecology-chatbot/app-core";
import type {
  AuthPort,
  KnowledgePort,
  MobileChatPort,
  MobileHomePort,
  MobileProfilePort,
  OnboardingPort,
} from "@gynecology-chatbot/app-core";
import { createMobileApiClient } from "../api/mobileApi";
import {
  ApiKnowledgeAdapter,
  ApiMobileAuthAdapter,
  ApiMobileChatAdapter,
  ApiMobileHomeAdapter,
  ApiMobileProfileAdapter,
  ApiOnboardingAdapter,
} from "./adapters/apiMobilePorts";
import { MockAuthPortAdapter, MockOnboardingPortAdapter } from "./adapters/mockMobileAuthPorts";
import {
  readMockMobileProfile,
  readMockMobileRuntime,
  updateMockMobileProfile,
} from "./mockMobileRuntime";

export interface MobileServices {
  authPort: AuthPort;
  onboardingPort: OnboardingPort;
  homePort: MobileHomePort;
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
}

export function createMobileServices(options: CreateMobileServicesOptions = {}): MobileServices {
  const provider = options.provider ?? ((process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER as "mock" | "api" | undefined) ?? "mock");
  const resolveUserId = () => {
    const userId = options.getUserId?.();
    if (userId) {
      return userId;
    }

    const runtimeUserId = readMockMobileRuntime().currentUser?.id;
    if (runtimeUserId) {
      return runtimeUserId;
    }

    const fallbackUserId = process.env.EXPO_PUBLIC_DEV_USER_ID;
    if (!fallbackUserId) {
      throw new Error("EXPO_PUBLIC_DEV_USER_ID is not configured");
    }

    return fallbackUserId;
  };

  if (provider === "api") {
    const client = createMobileApiClient({
      getUserId: resolveUserId,
    });

    return {
      authPort: new ApiMobileAuthAdapter(client),
      onboardingPort: new ApiOnboardingAdapter(client, resolveUserId),
      homePort: new ApiMobileHomeAdapter(client),
      chatPort: new ApiMobileChatAdapter(client),
      knowledgePort: new ApiKnowledgeAdapter(client),
      profilePort: new ApiMobileProfileAdapter(client),
    };
  }

  const chatPort = new MockMobileChatAdapter();

  return {
    authPort: new MockAuthPortAdapter(),
    onboardingPort: new MockOnboardingPortAdapter(),
    homePort: new RuntimeAwareMockMobileHomeAdapter(),
    chatPort,
    knowledgePort: {
      getLinkTarget(target: string, entityId?: string) {
        return chatPort.resolveLink(target, entityId);
      },
    },
    profilePort: {
      async getProfile() {
        return readMockMobileProfile();
      },
      async updateProfile(input) {
        return updateMockMobileProfile(input);
      },
    },
  };
}
