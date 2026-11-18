import { CreateTemperatureMeasurementData } from "services/temperatureService";
import {
	AvatarInput,
	ChangePasswordInput,
	DeleteAccountInput,
	DeleteMeasurementInput,
	LoginCredentials,
	SignupCredentials,
} from "./app.types";

export type AppEvents =
	// auth
	| ({ type: "auth.logIn" } & LoginCredentials)
	| ({ type: "auth.signUp" } & SignupCredentials)
	| { type: "auth.goToSignUp" }
	| { type: "auth.goToLogIn" }
	| { type: "auth.signOut" }

	// bottom bar
	| { type: "tab.home" }
	| { type: "tab.submitData" }
	| { type: "tab.profile" }

	// home
	| { type: "home.openLeaderboard" }
	| { type: "home.openCommunityGoal" }
	| { type: "home.openSubmitData" }

	// submit data
	| ({ type: "submit.send" } & { data: CreateTemperatureMeasurementData })
	| { type: "submit.close" }

	// profile
	| { type: "profile.openAchievements" }
	| { type: "profile.openMeasurements" }
	| ({ type: "profile.deleteMeasurement" } & DeleteMeasurementInput)
	| { type: "profile.openAvatars" }
	| ({ type: "profile.changeAvatar" } & AvatarInput)
	| { type: "profile.openChangePassword" }
	| ({ type: "profile.changePassword" } & ChangePasswordInput)
	| { type: "profile.openDeleteAccount" }
	| ({ type: "profile.confirmDeleteAccount" } & DeleteAccountInput)
	| { type: "profile.signOut" }
	| { type: "profile.confirmSignOut" }

	// generic
	| { type: "back" }
	| { type: "cancel" };
