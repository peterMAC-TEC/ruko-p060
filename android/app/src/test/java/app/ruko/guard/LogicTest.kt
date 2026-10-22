package app.ruko.guard

import org.junit.Test

// JUnit entry point (Android Studio or `./gradlew test`). The checks themselves are in LogicSelfTest.kt so they can also
// be run as a plain program without Android.
class LogicTest {
    @Test
    fun allLogicChecksPass() {
        LogicSelfTest.run("../test-vectors/number-vectors.csv")
    }
}
