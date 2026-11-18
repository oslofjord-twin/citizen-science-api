import { CreateTemperatureMeasurementData } from "services/temperatureService";
import { ChangePasswordInput, DeleteAccountInput, LoginCredentials, SignupCredentials } from "./app.machine";

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
	| { type: "profile.openSubmissions" }
	| { type: "profile.openAchievements" }
	| { type: "profile.openAvatars" }
	| { type: "profile.openChangePassword" }
	| { type: "profile.openDeleteAccount" }
	| ({ type: "profile.changePassword" } & ChangePasswordInput)
	| ({ type: "profile.confirmDeleteAccount" } & DeleteAccountInput)
	| { type: "profile.signOut" }
	| { type: "profile.confirmSignOut" }

	// generic
	| { type: "back" }
	| { type: "cancel" };
