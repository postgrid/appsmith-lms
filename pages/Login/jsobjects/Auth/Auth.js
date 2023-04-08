export default {
	signIn: async () => {
	return sign_in.run()
		.then(data => {
			delete data.user;
			showAlert('Welcome!','success')
			Object.keys(data).forEach(i => {
			storeValue(i, data[i]);
			})
		})
		.then(() => navigateTo('App'))
		.catch(() => {
					 navigateTo('Login'),
					 showAlert('Please enter a valid credentials','error')}
					 
			);
	
	},
	  Show: () => {
        showModal('Modal1');
},
	continue: async () => {
	if(!appsmith.URL.fullPath.includes('#access_token=')) return;
		 appsmith.URL.fullPath.split('#')[1].split('&').forEach(i => {
			const [key,value] = i.split('=');
			 storeValue(key,value); 
		});
		navigateTo('App');
	}
}