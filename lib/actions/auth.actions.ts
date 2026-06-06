'use server';

import {auth} from "@/lib/better-auth/auth";
import {sendSignUpEmailTask} from "@/lib/cron/tasks";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            // Non-blocking fire-and-forget for the welcome email
            sendSignUpEmailTask({ email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }).catch(console.error);
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign up failed' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}

export const requestPasswordReset = async (email: string) => {
    try {
        await auth.api.forgetPassword({
            body: {
                email,
                redirectTo: '/reset-password',
            },
        });
        // Always return success to prevent email enumeration attacks
        return { success: true };
    } catch (e) {
        console.log('Password reset request failed', e);
        return { success: false, error: 'Failed to send reset email. Please try again.' };
    }
};

export const resetPassword = async ({ token, newPassword }: { token: string; newPassword: string }) => {
    try {
        await auth.api.resetPassword({
            body: { token, newPassword },
        });
        return { success: true };
    } catch (e) {
        console.log('Password reset failed', e);
        return { success: false, error: 'Reset failed. The link may have expired.' };
    }
};
