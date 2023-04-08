export default {
	
logOut: async () =>{
	Object.keys(appsmith.store)
		.map(key => storeValue(key,undefined));
	navigateTo('Login')
	return appsmith.store
	},
changePassword: () => {
  
  if (Input1Copy.text !== Input1Copy1.text) {
   showAlert("New password and confirm password do not match",'error');
    return;
  }
	storeValue('newpw',Input1Copy1.text)
  		update_pw.run()
         .then(() => {showAlert('Password changed successfully','success'),storeValue('newpw',undefined)})
					.catch((error) => {showAlert("Error:", error)})
}
}