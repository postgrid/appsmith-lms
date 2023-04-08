export default {
	
logOut: async () =>{
	Object.keys(appsmith.store)
		.map(key => storeValue(key,undefined));
	navigateTo('Login')
	return appsmith.store
	}
}