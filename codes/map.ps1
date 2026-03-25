$map = @{
    "dashboard styling" = "Style dashboard components"
    "after clicking can u blur the background" = "Add background blur on click"
    "Try fixing this error: `Build Error: Parsing ecmascript source code fail" = "Fix build error: parsing ecmascript source code"
    "can u make the upload paper button big and at centre" = "Center and enlarge upload paper button"
    "after clicking on upload file can u reduce teh size of dialog box" = "Reduce dialog box size after upload file click"
    "can redesign the dashboard in such a way that it lokks cool and neew" = "Redesign dashboard for modern appearance"
    "no set it to #1F1926 color" = "Set color to #1F1926"
    "keep the image background as primary color" = "Set image background to primary color"
    "can u add a small ball like structure which follows the cursorin landing" = "Add cursor-following ball on landing page"
    "for the image can margin top left and botton of 20px" = "Add 20px margins to image"
    "Get Everything You Want You can get everything you want if you work hard" = "Update landing page text"
    "remove back to website" = "Remove back to website link"
    "https://images.pexels.com/photos/6306917/pexels-photo-6306917.jpeg put t" = "Add image from Pexels to login page"
    "add this image to the left of login page" = "Add image to left of login page"
    "make login page in the similar exact way" = "Style login page similarly"
    "i need login page in this way" = "Implement login page design"
    "can give some border radius to all the boxes" = "Add border radius to all boxes"
    "can u keep the entire theme of website to dark" = "Apply dark theme to website"
    "can u make the color scheme of login page similar to landing page" = "Match login page color scheme to landing page"
    "no still not done" = "Continue styling adjustments"
    "can u add some dynamic background for he alnding page" = "Add dynamic background to landing page"
    "no i need other options" = "Update options"
    "Try fixing this error: `Console FirebaseError: Firebase: Error (auth/ope" = "Fix Firebase auth operation error"
    "Try fixing this error: `Console Error: Invalid hook call. Hooks can only" = "Fix invalid hook call error"
    "Try fixing this error: `Build Error: Export signOut doesn't exist in tar" = "Fix build error: signOut export issue"
    "File changes" = "Update files"
    "Set up a Firebase backend" = "Set up Firebase backend"
    "can u make login with google working" = "Implement Google login"
    "create a landing page similar to it and then on clicking on try it for f" = "Create landing page with try it button"
    "its telling analysis failed" = "Fix analysis failure"
    "no  im not getting analysis result" = "Fix analysis result display"
    "no its really not working correct all the errors in the code and please " = "Fix code errors and analysis functionality"
    "no its not analyzing u just have a siple tast give it the gemini through" = "Integrate Gemini for analysis"
    "no even after clicking anayze paper its teh same thing im not fetting an" = "Fix analyze paper functionality"
    "again its showing failed" = "Fix analysis status"
    "still its showing failed" = "Fix analysis status"
    "after clicking analyze paper the status is showing failed" = "Fix analyze paper status"
    "view details is showing 404 This page could not be found." = "Fix view details 404 error"
    "view details not working" = "Fix view details functionality"
    "remove the publication date" = "Remove publication date field"
    "there is a mistake in the calender correct it" = "Fix calendar mistake"
    "make an option in upload to upload the file" = "Add file upload option"
    "upload paper not working" = "Fix paper upload functionality"
    "Initialized workspace with Firebase Studio" = "Initialize workspace with Firebase Studio"
}

$message = [Console]::In.ReadToEnd()
$message = $message.Trim()
if ($map.ContainsKey($message)) {
    $map[$message]
} else {
    $message
}