import type {
  AuthPort,
  KnowledgePort,
  MobileChatPort,
  MobileHomePort,
  MobileProfilePort,
  OnboardingPort,
  TodayPort,
} from "@gynecology-chatbot/app-core";
import {
  createMobileApiClient,
  readCurrentMobileUserId,
} from "../api/mobileApi";
import {
  ApiKnowledgeAdapter,
  ApiMobileAuthAdapter,
  ApiMobileChatAdapter,
  ApiMobileHomeAdapter,
  ApiMobileProfileAdapter,
  ApiOnboardingAdapter,
  ApiTodayAdapter,
} from "./adapters/apiMobilePorts";

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
  getUserId?: () => string;
}

export function createMobileServices(
  options: CreateMobileServicesOptions = {},
): MobileServices {
  const resolveUserId = () => {
    const userId = options.getUserId?.();
    if (userId) {
      return userId;
    }

    const mobileUserId = readCurrentMobileUserId();
    if (mobileUserId) {
      return mobileUserId;
    }

    throw new Error(
      "User ID is not available. Ensure session is restored before making API calls.",
    );
  };

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
