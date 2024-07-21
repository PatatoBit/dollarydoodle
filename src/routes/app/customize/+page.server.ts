import Stripe from 'stripe';
import { error, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const actions: Actions = {
	checkout: async ({ request }) => {
		let sessionUrl: string | null;

		const formData = await request.formData();

		const payloadData = {
			prompt: formData.get('prompt') as string,
			isPrivate: formData.get('private') == 'on',
			isExpress: formData.get('express') == 'on'
		};

		try {
			const session = await stripe.checkout.sessions.create({
				line_items: [
					{
						price: 'price_1PedNuJIiOwtKCnppUppAMtk',
						quantity: 1
					}
				],
				mode: 'payment',
				payment_method_types: ['card'],
				success_url: `${request.headers.get('origin')}/app/?success`,
				cancel_url: `${request.headers.get('origin')}/app/?cancelled`,
				metadata: {
					payloadData: JSON.stringify(payloadData)
				}
			});

			sessionUrl = session.url;

			// Saving document
		} catch (err) {
			console.error(err);
			throw error(500, 'Stripe error');
		}

		if (sessionUrl) {
			throw redirect(303, sessionUrl);
		}
	}
};
