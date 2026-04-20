import type {
  AuthPort,
  KnowledgePort,
  MobileChatPort,
  MobileHomePort,
  MobileProfilePort,
  MobileRecordsPort,
  OnboardingPort,
  TodayPort,
} from "@gynecology-chatbot/app-core";
import {
  createMobileApiClient,
  readCurrentMobileUserId,
} from "../api/mobileApi.ts";
import {
  ApiKnowledgeAdapter,
  ApiMobileAuthAdapter,
  ApiMobileChatAdapter,
  ApiMobileHomeAdapter,
  ApiMobileProfileAdapter,
  ApiMobileRecordsAdapter,
  ApiOnboardingAdapter,
  ApiTodayAdapter,
} from "./adapters/apiMobilePorts.ts";

export interface MobileServices {
  authPort: AuthPort;
  onboardingPort: OnboardingPort;
  homePort: MobileHomePort;
  todayPort: TodayPort;
  chatPort: MobileChatPort;
  knowledgePort: KnowledgePort;
  profilePort: MobileProfilePort;
  recordsPort: MobileRecordsPort;
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
    homePort: new ApiMobileHomeAdapter(client, resolveUserId),
    todayPort: new ApiTodayAdapter(client, resolveUserId),
    chatPort: new ApiMobileChatAdapter(client, resolveUserId),
    knowledgePort: new ApiKnowledgeAdapter(client, resolveUserId),
    profilePort: new ApiMobileProfileAdapter(client, resolveUserId),
    recordsPort: new ApiMobileRecordsAdapter(client, resolveUserId),
  };
}
