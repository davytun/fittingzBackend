--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING_PAYMENT',
    'PROCESSING',
    'READY_FOR_PICKUP',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'ON_HOLD',
    'CANCELLED'
);


ALTER TYPE public."ProjectStatus" OWNER TO postgres;

--
-- Name: TokenType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TokenType" AS ENUM (
    'EMAIL_VERIFICATION',
    'PASSWORD_RESET'
);


ALTER TYPE public."TokenType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Admin" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "businessName" text NOT NULL,
    "contactPhone" text,
    "businessAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Admin" OWNER TO postgres;

--
-- Name: Client; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE public."Client" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    "eventType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "adminId" text NOT NULL
);


ALTER TABLE public."Client" OWNER TO postgres;

--
-- Name: Measurement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Measurement" (
    id text NOT NULL,
    "clientId" text NOT NULL,
    fields jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Measurement" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    details text,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'NGN'::text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    status public."OrderStatus" DEFAULT 'PENDING_PAYMENT'::public."OrderStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text NOT NULL,
    "adminId" text NOT NULL,
    "projectId" text
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    status public."ProjectStatus" DEFAULT 'PENDING'::public."ProjectStatus" NOT NULL,
    "startDate" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text NOT NULL,
    "adminId" text NOT NULL
);


ALTER TABLE public."Project" OWNER TO postgres;

--
-- Name: StyleImage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StyleImage" (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "imageUrl" text NOT NULL,
    "publicId" text NOT NULL,
    category text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StyleImage" OWNER TO postgres;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VerificationToken" (
    id text NOT NULL,
    token text NOT NULL,
    type public."TokenType" NOT NULL,
    email text NOT NULL,
    "adminId" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Admin" (id, email, password, "businessName", "contactPhone", "businessAddress", "createdAt", "updatedAt", "isEmailVerified") FROM stdin;
cmcumsjdf000otva4y5i73aso	davidakintunde433@gmail.com	$2b$10$b252.rQ71kZ8r6Zo2VTQT.F10TZslrCNjzxHt3Nw87fvqcrULfJfe	Davytun	09044974094	6, road B anuoluwapo estate akingbala eleweran Abeokuta	2025-07-08 14:34:26.451	2025-07-08 14:35:25.081	t
cmcuovpox000wtva4sbkrql8o	davytunweb@gmail.com	$2b$10$05KbLGUPh/Fbvo.VIUmwSujWLPMnCwNtPuzP7P3dkaWDAjs6uYFvG	Wears	09044974094	6, road B anuoluwapo estate akingbala eleweran Abeokuta	2025-07-08 15:32:53.84	2025-07-08 15:33:28.461	t
\.


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Client" (id, name, phone, email, "eventType", "createdAt", "updatedAt", "adminId") FROM stdin;
cmcumu0ty000rtva4tw74lsgw	David Akintunde	09044974094	davidakintunde433@gmail.com	Traditional	2025-07-08 14:35:35.735	2025-07-08 14:35:35.735	cmcumsjdf000otva4y5i73aso
cmcw3xo3u0000tvi4oqakd4xn	Akintunde David	09044974094	davytunweb@gmail.com	Party	2025-07-09 15:22:05.513	2025-07-09 15:22:05.513	cmcuovpox000wtva4sbkrql8o
\.


--
-- Data for Name: Measurement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Measurement" (id, "clientId", fields, "createdAt", "updatedAt") FROM stdin;
cmcuneasb000ttva409t3ou1n	cmcumu0ty000rtva4tw74lsgw	{"bust": "1111", "hips": "11", "waist": "110", "inseam": "11", "armLength": "11", "shoulders": "11", "_uiFieldDefinitions": [{"key": "bust", "unit": "inches", "label": "Bust/Chest", "isCustom": false}, {"key": "waist", "unit": "inches", "label": "Waist", "isCustom": false}, {"key": "hips", "unit": "inches", "label": "Hips", "isCustom": false}, {"key": "shoulders", "unit": "inches", "label": "Shoulders", "isCustom": false}, {"key": "armLength", "unit": "inches", "label": "Arm Length", "isCustom": false}, {"key": "inseam", "unit": "inches", "label": "Inseam", "isCustom": false}, {"key": "neckCircumference", "unit": "inches", "label": "Neck", "isCustom": false}, {"key": "thighCircumference", "unit": "inches", "label": "Thigh", "isCustom": false}]}	2025-07-08 14:51:21.755	2025-07-09 14:30:09.055
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", details, price, currency, "dueDate", status, "createdAt", "updatedAt", "clientId", "adminId", "projectId") FROM stdin;
cmcw3mpn50007tv4c5g6w7u8i	jj	,,,,,,,,,,	666.00	NGN	2025-08-10 00:00:00	PROCESSING	2025-07-09 15:13:34.287	2025-07-09 15:13:34.287	cmcumu0ty000rtva4tw74lsgw	cmcumsjdf000otva4y5i73aso	cmcw31hlg0005tv4cn43jxzdp
cmcw4sxaw0001tvuw95z0xxts	55555	nnnnnnnnnn	4444.00	NGN	2025-08-10 00:00:00	PROCESSING	2025-07-09 15:46:23.768	2025-07-09 15:46:23.768	cmcw3xo3u0000tvi4oqakd4xn	cmcuovpox000wtva4sbkrql8o	cmcw3yo5b0002tvi4czonqi5d
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Project" (id, name, description, status, "startDate", "dueDate", "createdAt", "updatedAt", "clientId", "adminId") FROM stdin;
cmcw31hlg0005tv4cn43jxzdp	Davytun	jjjjj	COMPLETED	2025-07-09 00:00:00	\N	2025-07-09 14:57:04.083	2025-07-09 14:57:31.383	cmcumu0ty000rtva4tw74lsgw	cmcumsjdf000otva4y5i73aso
cmcw3yo5b0002tvi4czonqi5d	app.js	mmmmmmmmmmm	COMPLETED	2025-07-09 00:00:00	\N	2025-07-09 15:22:52.222	2025-07-09 15:22:52.222	cmcw3xo3u0000tvi4oqakd4xn	cmcuovpox000wtva4sbkrql8o
\.


--
-- Data for Name: StyleImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StyleImage" (id, "clientId", "imageUrl", "publicId", category, description, "createdAt", "updatedAt") FROM stdin;
cmcw4zast0003tvuw6ajjgbvq	cmcumu0ty000rtva4tw74lsgw	https://res.cloudinary.com/dqmg2ooqo/image/upload/v1752076279/style_inspirations/style_placeholder_1752076278385-852002219.svg	style_inspirations/style_placeholder_1752076278385-852002219	\N	\N	2025-07-09 15:51:21.197	2025-07-09 15:51:21.197
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VerificationToken" (id, token, type, email, "adminId", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
58cfd4da-78ba-4d56-965b-09b3ccfa801e	363ba04b40f8c29b1f825744ef3c009a8571a63126a3e87ec87806f8b371a819	2025-07-05 10:00:14.00255+01	20250705090013_init	\N	\N	2025-07-05 10:00:13.962498+01	1
c33571b2-f5ce-4d8f-86a5-4383d822ebd9	bb974a3f53672bd98bab7e42df4debedac10473ae953924023f18a967f1ef660	2025-07-05 16:50:21.510051+01	20250705155021_add_admin_login_tracking	\N	\N	2025-07-05 16:50:21.484993+01	1
1d3894a7-5eb1-472a-9572-410383de0467	c5528dd3fb3df2fe5323446c5e34072d89f00de411b480aa5a118d757aeac5b7	2025-07-06 22:11:33.71663+01	20250706211133_add_project_model	\N	\N	2025-07-06 22:11:33.639538+01	1
23e8032b-e6fc-4b82-abf6-806c2c1b607a	f9a9742a425faa36b462c1a266f873c548a6d1f9b62bb6c58308455d0099f99b	2025-07-06 22:54:30.928002+01	20250706215430_add_order_model	\N	\N	2025-07-06 22:54:30.886088+01	1
3fd04a52-18a7-4dfc-8e60-631adaea808e	61c62ea53892ccd2d497498813fd8d0054b2d75a0e059c2fd09274b711a2afeb	2025-07-07 11:34:58.348551+01	20250707103458_make_styleimage_category_optional	\N	\N	2025-07-07 11:34:58.342721+01	1
0cc6543b-8d49-4ae1-849c-18c58764bf90	c78db02ccccabdceecd37dee41fab2d9fd831d717dc7807328c6204c53a6032f	2025-07-09 12:09:47.908612+01	20250709110947_add_admin_attempt_tracking	\N	\N	2025-07-09 12:09:47.874278+01	1
\.


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: Measurement Measurement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Measurement"
    ADD CONSTRAINT "Measurement_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: StyleImage StyleImage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StyleImage"
    ADD CONSTRAINT "StyleImage_pkey" PRIMARY KEY (id);


--
-- Name: VerificationToken VerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VerificationToken"
    ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Admin_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Admin_email_key" ON public."Admin" USING btree (email);


--
-- Name: Client_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Client_adminId_idx" ON public."Client" USING btree ("adminId");


--
-- Name: Measurement_clientId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Measurement_clientId_idx" ON public."Measurement" USING btree ("clientId");


--
-- Name: Measurement_clientId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Measurement_clientId_key" ON public."Measurement" USING btree ("clientId");


--
-- Name: Order_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_adminId_idx" ON public."Order" USING btree ("adminId");


--
-- Name: Order_clientId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_clientId_idx" ON public."Order" USING btree ("clientId");


--
-- Name: Order_orderNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_orderNumber_idx" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_projectId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_projectId_idx" ON public."Order" USING btree ("projectId");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Project_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Project_adminId_idx" ON public."Project" USING btree ("adminId");


--
-- Name: Project_clientId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Project_clientId_idx" ON public."Project" USING btree ("clientId");


--
-- Name: Project_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Project_status_idx" ON public."Project" USING btree (status);


--
-- Name: StyleImage_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StyleImage_category_idx" ON public."StyleImage" USING btree (category);


--
-- Name: StyleImage_clientId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StyleImage_clientId_idx" ON public."StyleImage" USING btree ("clientId");


--
-- Name: VerificationToken_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "VerificationToken_adminId_idx" ON public."VerificationToken" USING btree ("adminId");


--
-- Name: VerificationToken_email_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "VerificationToken_email_type_idx" ON public."VerificationToken" USING btree (email, type);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Client Client_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."Admin"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Measurement Measurement_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Measurement"
    ADD CONSTRAINT "Measurement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."Admin"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Project Project_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."Admin"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StyleImage StyleImage_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StyleImage"
    ADD CONSTRAINT "StyleImage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VerificationToken VerificationToken_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VerificationToken"
    ADD CONSTRAINT "VerificationToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."Admin"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

