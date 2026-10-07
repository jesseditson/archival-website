import type { Carrier, CarrierJsonValue } from '@archival/carrier';

const carrier: Carrier = async (params, body, objects, site) => {
	if (!body) {
		throw new Error('Method Not Allowed');
	}
	if (typeof body !== 'object' || Array.isArray(body)) {
		throw new Error('form_id is required');
	}
	const formId = body['form_id'];
	delete body['form_id'];
	if (typeof formId !== 'string' || !formId) {
		throw new Error('form_id is required');
	}

	const formPayload = new URLSearchParams();
	for (const [key, value] of Object.entries<CarrierJsonValue | Blob>(body)) {
		if (typeof value === 'object') {
			throw new Error(`Unsupported value for ${key}`);
		}
		formPayload.append(key, String(value));
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
		return "redirect:" + site.url + `?submitStatus=error&error=${errorMessage}#contact-complete-error`;
	}

	return "redirect:" + site.url + '?submitStatus=ok#contact-complete';
};

export default carrier;
