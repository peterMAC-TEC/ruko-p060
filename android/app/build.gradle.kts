plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "app.ruko.guard"
    compileSdk = 34

    defaultConfig {
        applicationId = "app.ruko.guard"
        // The call-screening role needs Android 10 (API 29).
        minSdk = 29
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
        // The Ruko server this app talks to. Change it for a different deployment.
        buildConfigField("String", "RUKO_BASE_URL", "\"https://ruko-seven.vercel.app\"")
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

// No libraries on purpose: the app uses only the Android platform, so there is nothing extra to trust or keep updated.
dependencies {
    testImplementation("junit:junit:4.13.2")
}
