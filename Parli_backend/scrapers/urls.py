from django.urls import path
from scrapers.views import (
    scrape_bills, scrape_mla, scrape_loksabha, scrape_rajyasabha,
    get_bills, get_mla, get_loksabha, get_rajyasabha, get_all,
    scrape_governors, get_state_list, get_state_data, get_governors,
    get_attendance, get_attendance_person
)

urlpatterns = [
    path('scrape/bill/', scrape_bills, name='scrape_bills'),
    path('scrape/mla/', scrape_mla, name='scrape_mla'),
    path('scrape/loksabha/', scrape_loksabha, name='scrape_loksabha'),
    path('scrape/rajyasabha/', scrape_rajyasabha, name='scrape_rajyasabha'),
    path('scrape/governor/', scrape_governors, name='scrape_governors'),
    
    path('data/bill/', get_bills, name='get_bills'),
    path('data/mla/', get_mla, name='get_mla'),
    path('data/loksabha/', get_loksabha, name='get_loksabha'),
    path('data/rajyasabha/', get_rajyasabha, name='get_rajyasabha'),
    path('data/all/', get_all, name='get_all'),
    
    path('data/state/', get_state_list, name='get_state_list'),
    path('data/state/detail/', get_state_data, name='get_state_data_query'),
    path('data/state/<str:state_name>/', get_state_data, name='get_state_data'),
    path('data/governor/', get_governors, name='get_governors'),
    path('data/attendance/', get_attendance, name='get_attendance'),
    path('data/attendance/person/', get_attendance_person, name='get_attendance_person'),
]


