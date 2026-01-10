export default async function (params, body, env) {
	if (!body) {
		throw new Error('Method Not Allowed');
	}
	const formId = body['form_id'];
	delete body['form_id'];
	if (!formId) {
		throw new Error('form_id is required');
	}

	const formPayload = new URLSearchParams();
	for (const [key, value] of Object.entries(body ?? {})) {
		formPayload.append(key, value);
	}
	formPayload.append('submit', 'Submit');

	const response = await fetch(`https://docs.google.com/forms/d/e/${formId}/formResponse`, {
		method: 'POST',
		body: formPayload,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	});

	if (!response.ok) {
		// Decide how strict you want this to be
		const errorMessage = await response.text();
		console.error('Google Form error', response.status, errorMessage);
		return "redirect:" + env.SITE_URL + `?submitStatus=error&error=${errorMessage}#contact-complete-error`;
	}

	return "redirect:" + env.SITE_URL + '?submitStatus=ok#contact-complete';
}
